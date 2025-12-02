import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import {
    mapPropertyToProduct,
    checkRateLimit
} from '@/lib/backend-utils';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ handle: string }> }
) {
    try {
        checkRateLimit(request.headers, 'general');

        const { handle } = await params;

        let filter = "";
        if (handle === 'pgs') filter = "PG";
        if (handle === 'flats') filter = "Flat";
        if (handle === 'private-rooms') filter = "Room";

        let query = supabase.from("properties").select("*").eq('available_for_sale', true);

        if (filter) {
            query = query.ilike("title", `%${filter}%`);
        }

        if (handle === 'flats') {
            const { data, error } = await supabase.from("properties").select("*").eq('available_for_sale', true).or("title.ilike.%Flat%,title.ilike.%1BHK%");
            if (error) throw error;
            return NextResponse.json(data.map(mapPropertyToProduct));
        }

        const { data, error } = await query;
        if (error) throw error;

        return NextResponse.json(data.map(mapPropertyToProduct));
    } catch (error: any) {
        console.error('Error in GET /collections/[handle]/products:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ handle: string }> }
) {
    // Reusing the same logic as GET for now, as per original backend
    return GET(request, { params });
}
