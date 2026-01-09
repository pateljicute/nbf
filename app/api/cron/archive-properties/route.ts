
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

// Secure this route with a secret key
const CRON_SECRET = process.env.CRON_SECRET || 'fallback_secret_internal_only';

export const dynamic = 'force-dynamic'; // Prevent static caching

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${CRON_SECRET}`) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        // Logic: Archive properties created more than 60 days ago
        // You can adjust the interval as needed (e.g. 30 days, 90 days)
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 60);

        // Update 'status' to 'inactive' for soft archive
        // We don't delete them, just archive them.
        const { data, error } = await supabase
            .from('properties')
            .update({ status: 'inactive', available_for_sale: false })
            .eq('status', 'approved')
            .lt('created_at', cutoffDate.toISOString())
            .select('id');

        if (error) {
            console.error('Cron Archive Error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const count = data?.length || 0;

        return NextResponse.json({
            success: true,
            message: `Archived ${count} properties older than 60 days.`,
            archivedIds: data?.map(p => p.id) || []
        });

    } catch (error) {
        console.error('Cron Job Failed:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
