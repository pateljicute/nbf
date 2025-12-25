'use server';

import { Redis } from '@upstash/redis';
import { createClient } from '@supabase/supabase-js';

// Initialize Redis client
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
    : null;

// Initialize Supabase Admin Client for server-side checks
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
    console.warn('WARNING: SUPABASE_SERVICE_ROLE_KEY is missing. Admin actions may fail due to RLS.');
}

// Fallback to anon key but warn - this is likely why RLS fails
const supabaseKey = supabaseServiceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);
export async function checkAdminStatus(userId: string): Promise<boolean> {
    if (!userId) return false;

    const cacheKey = `auth:admin:${userId}`;

    // 1. Check Redis Cache
    if (redis) {
        try {
            const cachedStatus = await redis.get(cacheKey);
            if (cachedStatus !== null) {
                console.log('Cache hit for admin status:', userId);
                return Boolean(cachedStatus);
            }
        } catch (error) {
            console.warn('Redis cache error:', error);
        }
    }

    // 2. Check Supabase Database
    try {
        const { data, error } = await supabase
            .from("admin_users")
            .select("user_id")
            .eq("user_id", userId)
            .single();

        const isAdmin = !!data && !error;

        // 3. Cache the result
        if (redis) {
            try {
                // Cache for 5 minutes (300 seconds)
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

// Admin action to update product status (bypasses RLS with service role)
export async function updateProductStatusAction(
    productId: string, 
    availableForSale: boolean, 
    adminUserId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        // Verify admin status first
        const isAdmin = await checkAdminStatus(adminUserId);
        if (!isAdmin) {
            return { success: false, error: 'Unauthorized: Admin access required' };
        }

        // Update using service role client (bypasses RLS)
        const { data, error } = await supabase
            .from('properties')
            .update({ available_for_sale: availableForSale })
            .eq('id', productId)
            .select()
            .maybeSingle(); // Use maybeSingle to avoid 406 error on 0 rows

        if (error) {
            console.error('Error updating product status:', error);
            return { success: false, error: error.message };
        }

        if (!data) {
             return { success: false, error: 'Property not found or access denied (check RLS permissions)' };
        }

        return { success: true };    } catch (error: any) {
        console.error('Error in updateProductStatusAction:', error);
        return { success: false, error: error.message || 'Unknown error' };
    }
}

// Admin action to approve product (bypasses RLS with service role)
export async function approveProductAction(
    productId: string, 
    adminUserId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        // Verify admin status first
        const isAdmin = await checkAdminStatus(adminUserId);
        if (!isAdmin) {
            return { success: false, error: 'Unauthorized: Admin access required' };
        }

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

        // 3. Update property with new tags and set available_for_sale to true
        const { error: updateError } = await supabase
            .from('properties')
            .update({ 
                tags: newTags,
                available_for_sale: true 
            })
            .eq('id', productId);

        if (updateError) {
            console.error('Error approving product:', updateError);
            return { success: false, error: updateError.message };
        }

        return { success: true };
    } catch (error: any) {
        console.error('Error in approveProductAction:', error);
        return { success: false, error: error.message || 'Unknown error' };
    }
}

// Admin action to delete product (bypasses RLS with service role)
export async function adminDeleteProductAction(
    productId: string, 
    adminUserId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        // Verify admin status first
        const isAdmin = await checkAdminStatus(adminUserId);
        if (!isAdmin) {
            return { success: false, error: 'Unauthorized: Admin access required' };
        }

        // Delete using service role client (bypasses RLS)
        const { error } = await supabase
            .from('properties')
            .delete()
            .eq('id', productId);

        if (error) {
            console.error('Error deleting product:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error: any) {
        console.error('Error in adminDeleteProductAction:', error);
        return { success: false, error: error.message || 'Unknown error' };
    }
}
