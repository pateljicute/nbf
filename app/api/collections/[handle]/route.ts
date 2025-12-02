import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import {
    mapDbCollectionToCollection,
    cacheGet,
    cacheSet,
    validateInput,
    sanitizeInput,
    checkRateLimit
} from '@/lib/backend-utils';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ handle: string }> }
) {
    try {
        checkRateLimit(request.headers, 'general');

        const { handle } = await params;

        if (!handle || !validateInput(handle, 'string') || handle.length > 200) {
            return NextResponse.json({ error: "Security Alert: Invalid handle parameter" }, { status: 400 });
        }

        const sanitizedHandle = sanitizeInput(handle);

        const cacheKey = `collection_${sanitizedHandle}`;
        const cached = cacheGet(cacheKey);
        if (cached) {
            return NextResponse.json(cached);
        }

        const { data, error } = await supabase
            .from("collections")
            .select("*")
            .eq("handle", sanitizedHandle)
            .single();

        if (error || !data) {
            return NextResponse.json({ error: "Collection not found" }, { status: 404 });
        }

        const result = mapDbCollectionToCollection(data);
        cacheSet(cacheKey, result, 30 * 60 * 1000); // Cache for 30 minutes

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error in GET /collections/[handle]:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
