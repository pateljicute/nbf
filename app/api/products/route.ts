import { NextRequest, NextResponse } from 'next/server';
import { getProducts } from '@/lib/api';
import { checkRateLimit } from '@/lib/backend-utils';

// Force dynamic to prevent caching issues with search params
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        checkRateLimit(request.headers, 'general');
        const { searchParams } = new URL(request.url);

        // Convert searchParams to clean object
        const params: any = {};
        searchParams.forEach((value, key) => {
            params[key] = value;
        });

        // Use centralized logic
        const products = await getProducts({
            ...params,
            limit: params.limit ? parseInt(params.limit) : 50
        });

        return NextResponse.json(products);
    } catch (error: any) {
        console.error('Error in GET /products:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        checkRateLimit(request.headers, 'general');
        const body = await request.json();

        // Use centralized logic
        const products = await getProducts(body);

        return NextResponse.json(products);
    } catch (error: any) {
        console.error('Error in POST /products:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
