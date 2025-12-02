import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import {
    mapDbCollectionToCollection,
    cacheGet,
    cacheSet,
    checkRateLimit
} from '@/lib/backend-utils';

export async function GET(request: NextRequest) {
    try {
        checkRateLimit(request.headers, 'general');

        const cacheKey = 'collections';
        const cached = cacheGet(cacheKey);
        if (cached) {
            return NextResponse.json(cached);
        }

        const { data, error } = await supabase.from("collections").select("*");
        if (error) throw error;

        const result = data.map(mapDbCollectionToCollection);
        cacheSet(cacheKey, result, 30 * 60 * 1000); // Cache for 30 minutes

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error in GET /collections:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
