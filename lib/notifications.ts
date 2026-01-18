
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

// Configure Web Push (Must be done server-side)
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        `mailto:${process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@nbfhomes.in'}`,
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
}

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface NotificationPayload {
    title: string;
    body: string;
    url?: string;
    icon?: string;
}

export async function sendAdminPushNotification(payload: NotificationPayload) {
    console.log('[Notification] Starting send process...');

    // 1. Fetch all admin subscriptions
    // We assume any user in admin_settings table is an admin or has legitimate access settings
    // For tighter security, join with admin_users or check roles, but simpler for now.
    const { data: adminSettings, error } = await supabase
        .from('admin_settings')
        .select('user_id, push_subscription');

    if (error || !adminSettings) {
        console.error('[Notification] Failed to fetch admin settings:', error);
        return;
    }

    console.log(`[Notification] Found ${adminSettings.length} admins to notify.`);

    const notifications = adminSettings.map(async (admin) => {
        const subscription = admin.push_subscription;
        if (!subscription) return;

        try {
            await webpush.sendNotification(
                subscription,
                JSON.stringify(payload)
            );
            console.log(`[Notification] Sent to admin ${admin.user_id}`);
        } catch (err: any) {
            console.error(`[Notification] Failed to send to ${admin.user_id}:`, err);
            if (err.statusCode === 410 || err.statusCode === 404) {
                // Subscription has expired or is no longer valid
                console.log(`[Notification] Removing invalid subscription for ${admin.user_id}`);
                await supabase
                    .from('admin_settings')
                    .update({ push_subscription: null })
                    .eq('user_id', admin.user_id);
            }
        }
    });

    await Promise.all(notifications);
}
