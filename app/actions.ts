'use server';

import { Redis } from '@upstash/redis';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Initialize Redis client
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
    : null;

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
                    try {
                        cookieStore.set({ name, value, ...options });
                    } catch (error) {
                        // Handle cookie setting error
                    }
                },
                remove(name: string, options: CookieOptions) {
                    try {
                        cookieStore.set({ name, value: '', ...options });
                    } catch (error) {
                        // Handle cookie removal error
                    }
                },
            },
        }
    );
}

// Global admin client for status checks (using service role or anon key if missing)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const globalSupabase = createSupabaseClient(supabaseUrl, supabaseServiceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export async function checkAdminStatus(userId: string): Promise<boolean> {
    // SERVER-SIDE SECURITY CHECK
    if (!userId) return false;

    const cacheKey = `auth:admin:${userId}`;

    // 1. Check Redis Cache
    if (redis) {
        try {
            const cachedStatus = await redis.get(cacheKey);
            if (cachedStatus !== null) {
                return Boolean(cachedStatus);
            }
        } catch (error) {
            console.warn('Redis cache error:', error);
        }
    }

    // 2. Check Supabase Database
    try {
        // Use global client for checking admin status (public table)
        const { data, error } = await globalSupabase
            .from("admin_users")
            .select("user_id")
            .eq("user_id", userId)
            .single();

        const isAdmin = !!data && !error;

        // 3. Cache the result
        if (redis) {
            try {
                await redis.set(cacheKey, isAdmin, { ex: 300 });
            } catch (error) {
                console.warn('Redis set error:', error);
            }
        }

        return isAdmin;
    } catch (error) {
        console.error('Error checking admin status:', error);
        return false;
    }
}

// Admin action to update product status
export async function updateProductStatusAction(
    productId: string,
    availableForSale: boolean,
    adminUserId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const isAdmin = await checkAdminStatus(adminUserId);
        if (!isAdmin) {
            return { success: false, error: 'Unauthorized: Admin access required' };
        }

        // Use context-aware client to leverage RLS policies
        const supabase = await getSupabaseClient();

        const newStatus = availableForSale ? 'approved' : 'inactive';

        const { data, error } = await supabase
            .from('properties')
            .update({
                available_for_sale: availableForSale,
                status: newStatus
            })
            .eq('id', productId)
            .select()
            .maybeSingle();

        if (error) {
            console.error('Error updating product status:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error: any) {
        console.error('Error in updateProductStatusAction:', error);
        return { success: false, error: error.message || 'Unknown error' };
    }
}

// Admin action to approve product
export async function approveProductAction(
    productId: string,
    adminUserId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const isAdmin = await checkAdminStatus(adminUserId);
        if (!isAdmin) {
            return { success: false, error: 'Unauthorized: Admin access required' };
        }

        // Use context-aware client
        const supabase = await getSupabaseClient();

        // 1. Get current tags (legacy cleanup)
        const { data: product, error: fetchError } = await supabase
            .from('properties')
            .select('tags')
            .eq('id', productId)
            .maybeSingle();

        if (fetchError || !product) {
            return { success: false, error: 'Property not found' };
        }

        // 2. Remove 'pending_approval' tag (legacy cleanup)
        const newTags = (product.tags || []).filter((t: string) => t !== 'pending_approval');

        // 3. Update property status
        const { error: updateError } = await supabase
            .from('properties')
            .update({
                tags: newTags,
                available_for_sale: true,
                status: 'approved'
            })
            .eq('id', productId);

        if (updateError) {
            return { success: false, error: updateError.message };
        }

        return { success: true };
    } catch (error: any) {
        console.error('Error in approveProductAction:', error);
        return { success: false, error: error.message || 'Unknown error' };
    }
}

// Admin action to reject product
export async function rejectProductAction(
    productId: string,
    adminUserId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const isAdmin = await checkAdminStatus(adminUserId);
        if (!isAdmin) {
            return { success: false, error: 'Unauthorized: Admin access required' };
        }

        const supabase = await getSupabaseClient();

        // Update property status to rejected and inactive
        const { error } = await supabase
            .from('properties')
            .update({
                available_for_sale: false,
                status: 'rejected'
            })
            .eq('id', productId);

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error: any) {
        console.error('Error in rejectProductAction:', error);
        return { success: false, error: error.message || 'Unknown error' };
    }
}

// Admin action to delete product
export async function adminDeleteProductAction(
    productId: string,
    adminUserId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const isAdmin = await checkAdminStatus(adminUserId);
        if (!isAdmin) {
            return { success: false, error: 'Unauthorized: Admin access required' };
        }

        const supabase = await getSupabaseClient();

        const { error } = await supabase
            .from('properties')
            .delete()
            .eq('id', productId);

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error: any) {
        console.error('Error in adminDeleteProductAction:', error);
        return { success: false, error: error.message || 'Unknown error' };
    }
}

// User Actions
export async function updateUserRoleAction(userId: string, role: string, adminUserId: string) {
    const isAdmin = await checkAdminStatus(adminUserId);
    if (!isAdmin) return { success: false, error: 'Unauthorized' };

    const supabase = await getSupabaseClient();
    const { error } = await supabase.from('users').update({ role }).eq('id', userId);

    // Also sync with admin_users table for backward compatibility if role is admin
    if (role === 'admin') {
        const { error: adminError } = await globalSupabase.from('admin_users').upsert({ user_id: userId }, { onConflict: 'user_id', ignoreDuplicates: true });
        if (adminError) console.error("Error syncing admin user:", adminError);
    } else {
        // If downgrading, remove from admin_users
        const { error: deleteError } = await globalSupabase.from('admin_users').delete().eq('user_id', userId);
        if (deleteError) console.error("Error removing admin user:", deleteError);
    }

    return { success: !error, error: error?.message };
}

export async function toggleUserVerifiedAction(userId: string, isVerified: boolean, adminUserId: string) {
    const isAdmin = await checkAdminStatus(adminUserId);
    if (!isAdmin) return { success: false, error: 'Unauthorized' };

    const supabase = await getSupabaseClient();
    const { error } = await supabase.from('users').update({ is_verified: isVerified }).eq('id', userId);
    return { success: !error, error: error?.message };
}

export async function togglePropertyVerifiedAction(propertyId: string, isVerified: boolean, adminUserId: string) {
    const isAdmin = await checkAdminStatus(adminUserId);
    if (!isAdmin) return { success: false, error: 'Unauthorized' };

    const supabase = await getSupabaseClient();
    const { error } = await supabase.from('properties').update({ is_verified: isVerified }).eq('id', propertyId);
    return { success: !error, error: error?.message };
}

// ... existing ad actions ...

// Settings Actions
export async function updateSiteSettingsAction(settings: Record<string, string>, adminUserId: string) {
    const isAdmin = await checkAdminStatus(adminUserId);
    if (!isAdmin) return { success: false, error: 'Unauthorized' };

    const supabase = await getSupabaseClient();
    const upserts = Object.entries(settings).map(([key, value]) => ({ key, value }));
    const { error } = await supabase.from('site_settings').upsert(upserts);
    return { success: !error, error: error?.message };
}

export async function deleteAdAction(adminUserId: string) {
    const isAdmin = await checkAdminStatus(adminUserId);
    if (!isAdmin) return { success: false, error: 'Unauthorized' };

    const supabase = await getSupabaseClient();

    // We clear the ad fields but keep the row (or delete it, but clearing is safer for IDs)
    // Actually, SQL script used a fixed ID. Let's just update fields to empty/inactive.
    const { error } = await supabase
        .from('ads')
        .update({
            media_url: '',
            media_type: 'image', // reset to default
            cta_text: '',
            cta_link: '',
            is_active: false
        })
        .eq('id', '00000000-0000-0000-0000-000000000001');

    if (error) {
        console.error('Error deleting ad:', error);
        return { success: false, error: error.message };
    }

    return { success: true };
}

// Ad Actions
export async function getAdSettingsAction() {
    try {
        const supabase = await getSupabaseClient(); // Public read access
        const { data, error } = await supabase.from('ads').select('*').limit(1).single();

        if (error) {
            if (error.code === 'PGRST116') {
                return { success: true, data: null };
            }
            console.error('Error fetching ad settings:', JSON.stringify(error, null, 2));
            return { success: false, error: error.message };
        }
        return { success: true, data };
    } catch (error: any) {
        // Handle fetch/network errors (ECONNRESET etc)
        console.error('Exception in getAdSettingsAction:', error);
        return { success: false, error: error.message || 'Network error' };
    }
}

export async function updateAdSettingsAction(adData: { media_url: string; media_type: 'image' | 'video'; cta_text: string; cta_link: string; is_active: boolean }, adminUserId: string) {
    const isAdmin = await checkAdminStatus(adminUserId);
    if (!isAdmin) return { success: false, error: 'Unauthorized' };

    const supabase = await getSupabaseClient();

    // We update the single row (assuming ID is known or we just update the first one)
    // Actually, best to fetch the ID first or just upsert with a fixed ID if we enforced it in SQL
    // In SQL we inserted '00000000-0000-0000-0000-000000000001'. Let's use that.

    const { error } = await supabase
        .from('ads')
        .update(adData)
        .eq('id', '00000000-0000-0000-0000-000000000001');

    if (error) {
        // Fallback if ID doesn't exist (though SQL script should have created it)
        const { error: insertError } = await supabase.from('ads').insert({
            id: '00000000-0000-0000-0000-000000000001',
            ...adData
        });
        if (insertError) return { success: false, error: insertError.message };
    }

    return { success: true };
}

export async function submitInquiryAction(data: {
    firstName: string;
    lastName: string;
    email: string;
    subject: string;
    message: string;
    phoneNumber?: string;
    propertyId?: string;
}) {
    try {
        const supabase = await getSupabaseClient();

        const { error } = await supabase.from('inquiries').insert({
            first_name: data.firstName,
            last_name: data.lastName,
            email: data.email,
            subject: data.subject,
            message: data.message,
            phone_number: data.phoneNumber,
            property_id: data.propertyId
        });

        if (error) {
            console.error('Error inserting inquiry:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error: any) {
        console.error('Error in submitInquiryAction:', error);
        return { success: false, error: error.message || 'Unknown error' };
    }
}

export async function updateLeadStatusAction(leadId: string, status: string) {
    try {
        const supabase = await getSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return { success: false, error: 'Unauthorized' };

        const { error } = await supabase
            .from('leads_activity')
            .update({ status })
            .eq('id', leadId);

        if (error) throw error;
        return { success: true };
    } catch (error: any) {
        console.error('Error updating lead status:', error);
        return { success: false, error: error.message };
    }
}

export async function trackLeadActivity(data: { propertyId: string, actionType: 'whatsapp' | 'contact', ownerId?: string | null }) {
    console.log(`[TrackLead] Starting for property ${data.propertyId} action ${data.actionType} owner ${data.ownerId}`);
    const supabase = await getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        console.error('[TrackLead] No user found');
        return { success: false, error: 'Not authenticated' };
    }

    try {
        const payload: any = {
            property_id: data.propertyId,
            user_id: user.id,
            action_type: data.actionType,
            status: 'new'
        };

        // Only add owner_id if it's a valid UUID
        if (data.ownerId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.ownerId)) {
            payload.owner_id = data.ownerId;
        } else if (data.ownerId) {
            console.warn(`[TrackLead] Invalid owner UUID disregarded: ${data.ownerId}`);
        }

        console.log('[TrackLead] Inserting payload:', payload);

        const { data: result, error } = await supabase
            .from('leads_activity')
            .insert(payload)
            .select();

        if (error) {
            console.error('[TrackLead] Insert Error:', error);
            throw error;
        }

        console.log('[TrackLead] Insert Success:', result);
        return { success: true };
    } catch (error) {
        console.error('[TrackLead] Exception:', error);
        return { success: false, error: 'Failed to record activity' };
    }
}

export async function trackPropertyView(propertyId: string) {
    const supabase = await getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    try {
        console.log(`[TrackView] Recording view for user ${user.id} property ${propertyId}`);
        const { error } = await supabase
            .from('property_views')
            .insert({
                property_id: propertyId,
                user_id: user.id
            });

        if (error) {
            console.error('[TrackView] Error:', error);
        } else {
            console.log('[TrackView] Success');
        }
    } catch (err) {
        console.error('[TrackView] Exception:', err);
    }
}

export async function saveAdminSubscription(subscription: string) {
    try {
        const supabase = await getSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) throw new Error('Not authenticated');

        const isAdmin = await checkAdminStatus(user.id);
        if (!isAdmin) throw new Error('Not authorized');

        const { error } = await supabase
            .from('admin_settings')
            .upsert({
                user_id: user.id,
                push_subscription: JSON.parse(subscription),
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });

        if (error) throw error;
        return { success: true };
    } catch (error: any) {
        console.error('Error saving subscription:', error);
        return { success: false, error: error.message };
    }
}

export async function sendNewPropertyNotificationAction(propertyTitle: string, propertyLocation: string, propertyPrice: string) {
    try {
        const { sendAdminPushNotification } = await import('@/lib/notifications');
        await sendAdminPushNotification({
            title: `New Pending Property: ${propertyTitle}`,
            body: `Location: ${propertyLocation} | Price: ₹${propertyPrice}`,
            url: `/admin`
        });
        return { success: true };
    } catch (error) {
        console.error('Failed to trigger admin notification:', error);
        return { success: false };
    }
}



