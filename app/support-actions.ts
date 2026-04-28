'use server';

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Helper to create context-aware Supabase client
async function getSupabaseClient() {
    const cookieStore = await cookies();

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
                set(name: string, value: string, options: CookieOptions) {
                    try { cookieStore.set({ name, value, ...options }); } catch {}
                },
                remove(name: string, options: CookieOptions) {
                    try { cookieStore.set({ name, value: '', ...options }); } catch {}
                },
            },
        }
    );
}

// ── Check if user can submit (24h cooldown) ────────────────────────────────
export async function checkSupportCooldownAction(email: string, userId?: string): Promise<{
    canSubmit: boolean;
    hoursRemaining?: number;
    minutesRemaining?: number;
}> {
    try {
        const supabase = await getSupabaseClient();

        // Build query — check by email OR user_id (whichever is available)
        let query = supabase
            .from('support_requests')
            .select('created_at')
            .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
            .order('created_at', { ascending: false })
            .limit(1);

        if (userId) {
            query = query.or(`email.eq.${email},user_id.eq.${userId}`);
        } else {
            query = query.eq('email', email);
        }

        const { data, error } = await query;

        if (error || !data || data.length === 0) {
            return { canSubmit: true };
        }

        // Found a recent request — calculate remaining time
        const lastSubmission = new Date(data[0].created_at).getTime();
        const cooldownEnd = lastSubmission + 24 * 60 * 60 * 1000;
        const remainingMs = cooldownEnd - Date.now();

        if (remainingMs <= 0) return { canSubmit: true };

        const hoursRemaining = Math.floor(remainingMs / (60 * 60 * 1000));
        const minutesRemaining = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));

        return { canSubmit: false, hoursRemaining, minutesRemaining };
    } catch {
        return { canSubmit: true }; // Fail open (don't block user on error)
    }
}

// ── Submit Support Request ─────────────────────────────────────────────────
export async function submitSupportRequestAction(data: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    subject: string;
    message: string;
    userId?: string;
}) {
    try {
        const supabase = await getSupabaseClient();

        // Server-side 24h cooldown check
        const cooldown = await checkSupportCooldownAction(data.email, data.userId);
        if (!cooldown.canSubmit) {
            const timeMsg = cooldown.hoursRemaining
                ? `${cooldown.hoursRemaining}h ${cooldown.minutesRemaining}m`
                : `${cooldown.minutesRemaining} minutes`;
            return {
                success: false,
                error: `You have already submitted a request recently. Please wait ${timeMsg} before sending another.`,
                cooldown: true,
                hoursRemaining: cooldown.hoursRemaining,
                minutesRemaining: cooldown.minutesRemaining,
            };
        }

        // Insert into support_requests
        const { error } = await supabase.from('support_requests').insert({
            first_name: data.firstName,
            last_name: data.lastName,
            email: data.email,
            phone_number: data.phoneNumber,
            subject: data.subject,
            message: data.message,
            user_id: data.userId || null,
        });

        if (error) {
            console.error('Error inserting support request:', error);
            return { success: false, error: error.message };
        }

        // Notify Admin
        try {
            const { sendAdminPushNotification } = await import('@/lib/notifications');
            await sendAdminPushNotification({
                title: `📩 New Appeal: ${data.firstName}`,
                body: `Subject: ${data.subject}`,
                url: `/admin`
            });
        } catch (notifError) {
            console.warn('Admin notification failed:', notifError);
        }

        return { success: true };
    } catch (error: any) {
        console.error('Error in submitSupportRequestAction:', error);
        return { success: false, error: error.message || 'Unknown error' };
    }
}
