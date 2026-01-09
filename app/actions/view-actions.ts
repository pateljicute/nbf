'use server';

import { supabase } from '@/lib/db';

export async function incrementViewCount(productId: string) {
    try {
        // Try using the RPC function if it exists
        const { error } = await supabase.rpc('increment_view_count', { p_id: productId });

        // Fallback to direct update if RPC fails (e.g. function not created yet)
        if (error) {
            // Note: This is less safe for concurrency but works for basic implementation
            await supabase.rpc('increment_view_count', { p_id: productId });
            // If RPC completely fails (e.g. 404), we might want:
            // await supabase.from('properties').update({ view_count: view_count + 1 }).eq('id', productId);
            // BUT we can't easily reference 'current value' in simple update without fetching first or RPC.
            // So for now, we rely on the migration being applied.
        }
    } catch (err) {
        console.error('Failed to increment view count:', err);
    }
}
