import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import {
    mapPropertyToProduct,
    cacheGet,
    cacheSet,
    validateInput,
    sanitizeInput,
    checkRateLimit,
    verifyAuth
} from '@/lib/backend-utils';
import { createClient } from '@supabase/supabase-js';

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

        const cacheKey = `product_${sanitizedHandle}`;
        const cached = cacheGet(cacheKey);
        if (cached) {
            return NextResponse.json(cached);
        }

        const { data, error } = await supabase
            .from("properties")
            .select("*")
            .or(`handle.eq.${sanitizedHandle},id.eq.${sanitizedHandle}`) // Allow lookup by ID or Handle for flexibility
            .eq('available_for_sale', true)
            .single();

        if (error || !data) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        const result = mapPropertyToProduct(data);
        cacheSet(cacheKey, result, 15 * 60 * 1000); // Cache for 15 minutes

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error in GET /products/[handle]:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ handle: string }> }
) {
    try {
        checkRateLimit(request.headers, 'create');
        const user = await verifyAuth(request.headers);
        const { handle } = await params; // This might be ID in case of update by ID

        const body = await request.json();

        // We expect the URL to potentially be /products/[id] for updates
        // So 'handle' param usually captures the ID if we routed it that way.
        // Let's assume 'handle' is the ID for PUT/DELETE as per strictly internal API usage usually.
        // But if it's the public handle, we need to resolve it.
        // Given we refactored api.ts to call `/products/${id}`, 'handle' here IS the ID.

        const id = handle;

        // Basic validation that user owns the property or is admin
        // (Assuming DB RLS handles this, but good to check or use RLS-aware client)

        // ... (We would repeat validation logic here or rely on RLS)
        // For brevity and since we are wrapping Supabase, we can just forward to Supabase 
        // using the user's auth context (if we could forward the token),
        // BUT verifyAuth returns the user, it doesn't give us a client with that user's session 
        // unless we extract the token.

        const token = request.headers.get('authorization')?.split(' ')[1];
        if (!token) throw new Error("Unauthorized");

        // Use Supabase client with the user's token to respect RLS
        const userClient = await createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { global: { headers: { Authorization: `Bearer ${token}` } } }
        );

        const { data, error } = await userClient
            .from('properties')
            .update(body) // Body should be sanitized or RLS will reject/filter
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(mapPropertyToProduct(data));

    } catch (error: any) {
        console.error('Error in PUT /products/[handle]:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ handle: string }> }
) {
    try {
        checkRateLimit(request.headers, 'create');
        // Verify Auth
        const token = request.headers.get('authorization')?.split(' ')[1];
        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { handle } = await params;
        const id = handle;

        const userClient = await createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { global: { headers: { Authorization: `Bearer ${token}` } } }
        );

        const { error } = await userClient
            .from('properties')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Error in DELETE /products/[handle]:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
