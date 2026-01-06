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

        const { data, error } = await supabase
            .from('properties')
            .update({ available_for_sale: availableForSale })
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

        // 1. Get current tags
        const { data: product, error: fetchError } = await supabase
            .from('properties')
            .select('tags')
            .eq('id', productId)
            .maybeSingle();

        if (fetchError || !product) {
            return { success: false, error: 'Property not found' };
        }

        // 2. Remove 'pending_approval' tag
        const newTags = (product.tags || []).filter((t: string) => t !== 'pending_approval');

        // 3. Update property
        const { error: updateError } = await supabase
            .from('properties')
            .update({
                tags: newTags,
                available_for_sale: true
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
    const supabase = await getSupabaseClient(); // Public read access
    const { data, error } = await supabase.from('ads').select('*').limit(1).single();
    if (error) {
        if (error.code === 'PGRST116') {
            return { success: true, data: null };
        }
        console.error('Error fetching ad settings:', error);
        return { success: false, error: error.message };
    }
    return { success: true, data };
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
