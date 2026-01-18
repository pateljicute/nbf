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

        const { searchParams } = new URL(request.url);
        const lat = parseFloat(searchParams.get('lat') || '');
        const lng = parseFloat(searchParams.get('lng') || '');
        const radius = parseFloat(searchParams.get('radius') || '20'); // Default 20km
        const mode = searchParams.get('mode');

        // 1. Popular Areas Mode (Grouped by Locality)
        if (mode === 'areas' && !isNaN(lat) && !isNaN(lng)) {
            // Optimally, use an RPC for this. For now, fetch nearby and group in JS (MVP)
            // or return static popular areas if no data.
            // Using RPC 'get_nearby_properties' to get raw data then group.
            const { data: properties, error } = await supabase.rpc('get_nearby_properties', {
                user_lat: lat,
                user_lng: lng,
                radius_meters: radius * 1000
            });

            if (error) {
                console.warn("RPC failed, falling back to simple query", error);
                // Fallback: Fetch all within rough box or just popular ones
            }

            if (properties && properties.length > 0) {
                // Group by locality
                const areasMap = new Map<string, { name: string, city: string, count: number, distance: number }>();

                properties.forEach((p: any) => {
                    const locality = p.locality || p.address?.split(',')[0] || 'Unknown';
                    const city = p.city || 'Mandsaur';
                    const key = `${locality}-${city}`;

                    if (!areasMap.has(key)) {
                        areasMap.set(key, { name: locality, city, count: 0, distance: 0 }); // dist calc todo
                    }
                    areasMap.get(key)!.count++;
                });

                return NextResponse.json(Array.from(areasMap.values()).slice(0, 10));
            }

            return NextResponse.json([]); // Return empty if no nearby found (UI handles fallback)
        }

        // 2. Radius Search for Properties
        if (!isNaN(lat) && !isNaN(lng)) {
            const { data, error } = await supabase.rpc('get_nearby_properties', {
                user_lat: lat,
                user_lng: lng,
                radius_meters: radius * 1000
            });

            if (!error && data) {
                return NextResponse.json(data.map(mapPropertyToProduct));
            }
            // If error (e.g. function doesn't exist yet), fall through to standard fetch & JS filter?
            // For now, let's assume the migration runs. If not, we return standard list.
            console.warn("Spatial query failed or no data, returning standard list.");
        }

        // 3. Standard List (Existing Logic)
        const CACHE_KEY = 'all_properties_v4';
        const cached = cacheGet(CACHE_KEY);
        if (cached) {
            return NextResponse.json(cached);
        }

        const { data, error } = await supabase
            .from("properties")
            .select('id,handle,title,description,price_range,currency_code,featured_image,tags,available_for_sale,category_id,"contactNumber",user_id,seo,"bathroomType","securityDeposit","electricityStatus","tenantPreference",latitude,longitude,"googleMapsLink",is_verified,status,view_count,created_at,"price","location","address","type",state,city,locality')
            .eq('available_for_sale', true)
            .limit(50);
        if (error) throw error;

        const result = data.map(mapPropertyToProduct);
        cacheSet(CACHE_KEY, result, 30 * 1000); // Cache for 30 seconds for better sync

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

        const safeLimit = limit && validateInput(limit, 'number')
            ? Math.max(1, Math.min(Math.floor(limit), 50))
            : 24;

        if (query && validateInput(query, 'string')) {
            query = sanitizeInput(query);
        } else if (query) {
            throw new Error("Security Alert: Invalid query parameter");
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

        let dbQuery = supabase
            .from("properties")
            .select('id,handle,title,description,price_range,currency_code,featured_image,tags,available_for_sale,category_id,"contactNumber",user_id,seo,"bathroomType","securityDeposit","electricityStatus","tenantPreference",latitude,longitude,"googleMapsLink",is_verified,status,view_count,created_at,"price","location","address","type",state,city,locality,built_up_area,furnishing_status,floor_number,total_floors')
            .limit(safeLimit);

        // Apply base filter
        dbQuery = dbQuery.eq('available_for_sale', true);

        // Apply search and filtering
        // Apply search and filtering
        if (query) {
            const safeQuery = sanitizeInput(query).replace(/[,()]/g, ' ').trim();

            // STRATEGY: Priority Search
            // 1. Explicit Column Match (City/State/Locality) - STRICT
            // 2. Geocoding + Radius (Spatial) - PROXIMITY
            // 3. Text Search (Title/Desc) - FALLBACK

            // --- Priority 1: Explicit Column Match ---
            // Check if the query matches a location field directly.
            const { data: strictData, error: strictError } = await supabase
                .from("properties")
                .select('id,handle,title,description,price_range,currency_code,featured_image,tags,available_for_sale,category_id,"contactNumber",user_id,seo,"bathroomType","securityDeposit","electricityStatus","tenantPreference",latitude,longitude,"googleMapsLink",is_verified,status,view_count,created_at,"price","location","address","type",state,city,locality,built_up_area,furnishing_status,floor_number,total_floors')
                .eq('available_for_sale', true)
                .or(`city.ilike.%${safeQuery}%,locality.ilike.%${safeQuery}%,state.ilike.%${safeQuery}%`)
                .limit(50); // Safe limit

            if (!strictError && strictData && strictData.length > 0) {
                console.log(`API POST: STRICT COLUMN MATCH found ${strictData.length} for '${safeQuery}'`);
                let results = strictData.map(mapPropertyToProduct);
                // Apply In-Memory Price Filter (reusing logic from below if needed, but dbQuery filters handled price too.
                // Wait, here we bypassed price filters. Let's apply them in memory).
                if (minPrice !== undefined) {
                    const min = parseFloat(minPrice);
                    results = results.filter(p => {
                        const priceVal = p.price?.toString() || p.priceRange?.minVariantPrice?.amount || '0';
                        return parseFloat(priceVal) >= min;
                    });
                }
                if (maxPrice !== undefined) {
                    const max = parseFloat(maxPrice);
                    results = results.filter(p => {
                        const priceVal = p.price?.toString() || p.priceRange?.minVariantPrice?.amount || '0';
                        return parseFloat(priceVal) <= max;
                    });
                }
                return NextResponse.json(results);
            }

            // --- Priority 2: Strict Geocoding + Radius Search ---
            let geoSucceeded = false;

            try {
                // Quick geocode
                const geoUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(safeQuery)}&limit=1`;
                const geoRes = await fetch(geoUrl, {
                    headers: { 'User-Agent': 'NBFHomes-Server' },
                    cache: 'no-store' // Ensure fresh results
                });

                if (geoRes.ok) {
                    const geoData = await geoRes.json();
                    if (geoData && geoData.length > 0) {
                        geoSucceeded = true; // Mark as successful place detection
                        const { lat, lon } = geoData[0];

                        // STRICT: Found a place, so we ONLY look nearby (20km).
                        const { data: nearby, error: rpcError } = await supabase.rpc('get_nearby_properties', {
                            user_lat: parseFloat(lat),
                            user_lng: parseFloat(lon),
                            radius_meters: 20000 // 20km Radius
                        });

                        if (!rpcError && nearby) {
                            let results = (nearby as any[]).map(mapPropertyToProduct);

                            // Apply In-Memory Price Filter
                            if (minPrice !== undefined) {
                                const min = parseFloat(minPrice);
                                results = results.filter(p => {
                                    const priceVal = p.price?.toString() || p.priceRange?.minVariantPrice?.amount || '0';
                                    return parseFloat(priceVal) >= min;
                                });
                            }
                            if (maxPrice !== undefined) {
                                const max = parseFloat(maxPrice);
                                results = results.filter(p => {
                                    const priceVal = p.price?.toString() || p.priceRange?.minVariantPrice?.amount || '0';
                                    return parseFloat(priceVal) <= max;
                                });
                            }

                            console.log(`API POST: Strict Geocode found ${results.length} results for ${safeQuery}`);
                            return NextResponse.json(results);
                        } else {
                            // Valid place but RPC error or no data
                            return NextResponse.json([]);
                        }
                    }
                }
            } catch (e) {
                console.warn('Server-side geocoding failed', e);
            }

            // --- Priority 3: Fallback Text Search ---
            // Only runs if spatial search returned nothing AND explicit DB match failed.
            if (!geoSucceeded && safeQuery) {
                dbQuery = dbQuery.or(`title.ilike.%${safeQuery}%,description.ilike.%${safeQuery}%`);
            } else if (geoSucceeded) {
                // Should be unreachable due to returns above, but safety check
                return NextResponse.json([]);
            }
        }

        if (minPrice !== undefined) {
            dbQuery = dbQuery.gte('price_range->minVariantPrice->amount', parseFloat(minPrice).toString());
        }
        if (maxPrice !== undefined) {
            dbQuery = dbQuery.lte('price_range->minVariantPrice->amount', parseFloat(maxPrice).toString());
        }

        if (location) {
            dbQuery = dbQuery.contains('tags', [sanitizeInput(location)]);
        }

        if (propertyType) {
            dbQuery = dbQuery.contains('tags', [sanitizeInput(propertyType)]);
        }

        if (amenities && Array.isArray(amenities)) {
            for (const amenity of amenities) {
                if (validateInput(amenity, 'string')) {
                    dbQuery = dbQuery.contains('tags', [sanitizeInput(amenity)]);
                }
            }
        }

        if (sortKey === 'PRICE') {
            dbQuery = dbQuery.order('price_range->minVariantPrice->amount', { ascending: !reverse });
        } else if (sortKey === 'CREATED_AT') {
            dbQuery = dbQuery.order('created_at', { ascending: !reverse });
        } else if (sortKey === 'RELEVANCE' && query) {
            dbQuery = dbQuery.order('id', { ascending: false });
        } else {
            dbQuery = dbQuery.order('created_at', { ascending: false });
        }

        const { data, error } = await dbQuery;
        if (error) throw error;

        return NextResponse.json(data.map(mapPropertyToProduct));
    } catch (error: any) {
        console.error('Error in POST /products:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
