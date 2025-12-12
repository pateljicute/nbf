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
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
