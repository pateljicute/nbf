import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import {
    mapPropertyToProduct,
    cacheGet,
    cacheSet,
    validateInput,
    sanitizeInput,
    checkRateLimit
} from '@/lib/backend-utils';

export async function GET(request: NextRequest) {
    try {
        checkRateLimit(request.headers, 'general');

        const cacheKey = 'all_properties';
        const cached = cacheGet(cacheKey);
        if (cached) {
            return NextResponse.json(cached);
        }

        const { data, error } = await supabase.from("properties").select("*").eq('available_for_sale', true);
        if (error) throw error;

        const result = data.map(mapPropertyToProduct);
        cacheSet(cacheKey, result, 10 * 60 * 1000); // Cache for 10 minutes

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error in GET /products:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        checkRateLimit(request.headers, 'general');

        const body = await request.json();
        console.log('POST /products body:', body);

        // Validate and sanitize inputs
        let { query, limit, sortKey, reverse, minPrice, maxPrice, location, propertyType, amenities } = body;

        if (query && validateInput(query, 'string')) {
            query = sanitizeInput(query);
        } else if (query) {
            throw new Error("Security Alert: Invalid query parameter");
        }

        if (limit !== undefined) {
            if (!validateInput(limit, 'number') || limit < 1 || limit > 1000) {
                throw new Error("Security Alert: Invalid limit parameter");
            }
            limit = Math.floor(limit);
        }

        if (sortKey && !['PRICE', 'CREATED_AT', 'RELEVANCE'].includes(sortKey)) {
            throw new Error("Security Alert: Invalid sortKey parameter");
        }

        if (reverse !== undefined && !validateInput(reverse, 'boolean')) {
            throw new Error("Security Alert: Invalid reverse parameter");
        }

        if (minPrice !== undefined && (!validateInput(parseFloat(minPrice), 'number') || parseFloat(minPrice) < 0)) {
            throw new Error("Security Alert: Invalid minPrice parameter");
        }

        if (maxPrice !== undefined && (!validateInput(parseFloat(maxPrice), 'number') || parseFloat(maxPrice) < 0)) {
            throw new Error("Security Alert: Invalid maxPrice parameter");
        }

        if (location !== undefined && !validateInput(location, 'string')) {
            throw new Error("Security Alert: Invalid location parameter");
        }

        if (propertyType !== undefined && !['PG', 'Flat', 'Room', 'Hostel', '1BHK', '2BHK', '3BHK'].includes(propertyType)) {
            throw new Error("Security Alert: Invalid propertyType parameter");
        }

        if (amenities !== undefined && !Array.isArray(amenities)) {
            throw new Error("Security Alert: Invalid amenities parameter");
        }

        let dbQuery = supabase.from("properties").select("*");

        // Apply base filter
        dbQuery = dbQuery.eq('available_for_sale', true);

        // Apply search and filtering
        if (query) {
            dbQuery = dbQuery.or(`title.ilike.%${sanitizeInput(query)}%,description.ilike.%${sanitizeInput(query)}%`);
        }

        if (minPrice !== undefined) {
            dbQuery = dbQuery.gte('price_range->minVariantPrice->amount', parseFloat(minPrice).toString());
        }
        if (maxPrice !== undefined) {
            dbQuery = dbQuery.lte('price_range->minVariantPrice->amount', parseFloat(maxPrice).toString());
        }

        if (location) {
            dbQuery = dbQuery.ilike('tags', `%${sanitizeInput(location)}%`);
        }

        if (propertyType) {
            dbQuery = dbQuery.ilike('tags', `%${sanitizeInput(propertyType)}%`);
        }

        if (amenities && Array.isArray(amenities)) {
            for (const amenity of amenities) {
                if (validateInput(amenity, 'string')) {
                    dbQuery = dbQuery.ilike('tags', `%${sanitizeInput(amenity)}%`);
                }
            }
        }

        if (limit) {
            dbQuery = dbQuery.limit(limit);
        }

        if (sortKey === 'PRICE') {
            dbQuery = dbQuery.order('price_range->minVariantPrice->amount', { ascending: !reverse });
        } else if (sortKey === 'CREATED_AT') {
            dbQuery = dbQuery.order('created_at', { ascending: !reverse });
        } else if (sortKey === 'RELEVANCE' && query) {
            dbQuery = dbQuery.order('id', { ascending: false });
        } else {
            dbQuery = dbQuery.order('id', { ascending: false });
        }

        const { data, error } = await dbQuery;
        if (error) throw error;

        return NextResponse.json(data.map(mapPropertyToProduct));
    } catch (error: any) {
        console.error('Error in POST /products:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
