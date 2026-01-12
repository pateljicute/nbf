'use server';

import { supabase } from '@/lib/db';
import { getAdminClient } from '@/lib/supabase-admin';

export async function incrementLeadsCountAction(productId: string) {
    console.log(`[Lead Tracking] Processing lead for product: ${productId}`);
    try {
        // 1. Try using the RPC function (Best Performance)
        const { error: rpcError } = await supabase.rpc('increment_leads_count', { row_id: productId });

        if (!rpcError) {
            console.log(`[Lead Tracking] Success via RPC for ${productId}`);
            return { success: true, method: 'rpc' };
        }

        console.warn(`[Lead Tracking] RPC failed: ${rpcError.message}. Trying Admin fallback...`);

        // 2. Fallback: Use Admin Client (Service Role) to bypass RLS
        const adminClient = getAdminClient();
        if (!adminClient) {
            console.error('[Lead Tracking] Admin client unavailable.');
            return { success: false, error: 'Admin client unavailable' };
        }

        // Fetch current count first (not atomic, but acceptable for fallback)
        const { data: product, error: fetchError } = await adminClient
            .from('properties')
            .select('leads_count')
            .eq('id', productId)
            .single();

        if (fetchError || !product) {
            console.error(`[Lead Tracking] Failed to fetch product ${productId}:`, fetchError);
            return { success: false, error: 'Product not found' };
        }

        const newCount = (Number(product.leads_count) || 0) + 1;

        const { error: updateError } = await adminClient
            .from('properties')
            .update({ leads_count: newCount })
            .eq('id', productId);

        if (updateError) {
            console.error(`[Lead Tracking] Admin update failed:`, updateError);
            return { success: false, error: updateError.message };
        }

        console.log(`[Lead Tracking] Success via Admin Update (New Count: ${newCount})`);
        return { success: true, method: 'admin_update' };

    } catch (err) {
        console.error('[Lead Tracking] Unexpected error:', err);
        return { success: false, error: 'Unexpected error' };
    }
}
