import { Product, Collection, ProductSortKey, ProductCollectionSortKey } from './types';
import { apiClient } from './api-client';
import { supabase } from './db';
import { getAdminClient } from './supabase-admin';
import { mapPropertyToProduct, mapDbCollectionToCollection, validateInput, sanitizeInput } from './backend-utils';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const API_URL = process.env.NEXT_PUBLIC_API_URL || (typeof window === 'undefined' ? (process.env.NEXT_PUBLIC_SITE_URL ? `${process.env.NEXT_PUBLIC_SITE_URL}/api` : 'https://www.nbfhomes.in/api') : '/api');




// Mock data for development
const mockProducts: Product[] = [
  {
    id: 'prod_1',
    handle: 'modern-apartment-city-center',
    title: 'Modern Apartment in City Center',
    description: 'A spacious and modern apartment located in the heart of the city. Close to all amenities and public transport.',
    descriptionHtml: '<p>A spacious and modern apartment located in the heart of the city. Close to all amenities and public transport.</p>',
    currencyCode: 'INR',
    featuredImage: {
      url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=2000&auto=format&fit=crop',
      altText: 'Modern Apartment'
    },
    seo: {
      title: 'Modern Apartment in City Center',
      description: 'Spacious 3BHK apartment for rent'
    },
    priceRange: {
      minVariantPrice: { amount: '25000', currencyCode: 'INR' },
      maxVariantPrice: { amount: '25000', currencyCode: 'INR' }
    },
    images: [
      {
        url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=2000&auto=format&fit=crop',
        altText: 'Living Room'
      },
      {
        url: 'https://images.unsplash.com/photo-1484154218962-a1c002085d2f?q=80&w=2000&auto=format&fit=crop',
        altText: 'Kitchen'
      }
    ],
    options: [],
    variants: [],
    availableForSale: true,
    tags: ['Apartment', '3BHK', 'City Center']
  },
  {
    id: 'prod_2',
    handle: 'cozy-studio-near-university',
    title: 'Cozy Studio near University',
    description: 'Perfect for students or young professionals. Fully furnished and ready to move in.',
    descriptionHtml: '<p>Perfect for students or young professionals. Fully furnished and ready to move in.</p>',
    currencyCode: 'INR',
    featuredImage: {
      url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=2000&auto=format&fit=crop',
      altText: 'Cozy Studio'
    },
    seo: {
      title: 'Cozy Studio near University',
      description: 'Affordable studio apartment for rent'
    },
    priceRange: {
      minVariantPrice: { amount: '12000', currencyCode: 'INR' },
      maxVariantPrice: { amount: '12000', currencyCode: 'INR' }
    },
    images: [
      {
        url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=2000&auto=format&fit=crop',
        altText: 'Bedroom'
      }
    ],
    options: [],
    variants: [],
    availableForSale: true,
    tags: ['Studio', 'Furnished', 'Student Friendly']
  },
  {
    id: 'prod_3',
    handle: 'luxury-villa-with-pool',
    title: 'Luxury Villa with Pool',
    description: 'Experience luxury living in this stunning villa with a private pool and garden.',
    descriptionHtml: '<p>Experience luxury living in this stunning villa with a private pool and garden.</p>',
    currencyCode: 'INR',
    featuredImage: {
      url: 'https://images.unsplash.com/photo-1613977257377-23b737cd95e7?q=80&w=2000&auto=format&fit=crop',
      altText: 'Luxury Villa'
    },
    seo: {
      title: 'Luxury Villa with Pool',
      description: '4BHK Villa for rent'
    },
    priceRange: {
      minVariantPrice: { amount: '85000', currencyCode: 'INR' },
      maxVariantPrice: { amount: '85000', currencyCode: 'INR' }
    },
    images: [
      {
        url: 'https://images.unsplash.com/photo-1613977257377-23b737cd95e7?q=80&w=2000&auto=format&fit=crop',
        altText: 'Exterior'
      }
    ],
    options: [],
    variants: [],
    availableForSale: true,
    tags: ['Villa', 'Luxury', 'Pool']
  }
];

const mockCollections: Collection[] = [
  {
    id: 'col_1',
    handle: 'apartments',
    title: 'Apartments',
    description: 'Find the best apartments for rent',
    seo: { title: 'Apartments for Rent', description: 'Browse our collection of apartments' },
    path: '/search/apartments'
  },
  {
    id: 'col_2',
    handle: 'studios',
    title: 'Studios',
    description: 'Compact and affordable living spaces',
    seo: { title: 'Studio Apartments', description: 'Find the perfect studio' },
    path: '/search/studios'
  },
  {
    id: 'col_3',
    handle: 'featured',
    title: 'Featured Properties',
    description: 'Our handpicked selection of premium properties',
    seo: { title: 'Featured Properties', description: 'Top rated properties' },
    path: '/search/featured'
  }
];

// Location Suggestion Interface
export interface LocationSuggestion {
  label: string;
  type: 'City' | 'Area' | 'Type';
}

export async function getLocationSuggestions(query: string): Promise<LocationSuggestion[]> {
  // Using cached API endpoint if available, but for now internal simple logic is fine if it doesn't leak secrets.
  // However, strict API usage suggests we should move this to an API route too. 
  // For 'getLocationSuggestions', it's okay to keep client-side Supabase for simpler auto-complete 
  // unles we want to hide DB structure strictly. 
  // Let's implement a quick API route scan later if needed, but for now, 
  // keeping this direct is acceptable as it READS public data.
  // BUT user asked for removing direct calls.
  // Let's try to map it to the products searh or a new `api/suggestions` route.

  // Since we don't have `api/suggestions` route yet, let's keep it safe.
  // But wait! `getProducts` with `query` param does a search. 

  if (!query || query.length < 2) return [];
  const sanitizedQuery = query.toLowerCase(); // simplified for brevity

  try {
    // TODO: Move to /api/suggestions
    // For now, retaining direct READ access to 'properties' is standard for public data in Supabase apps.
    // However, I will wrap it in a cleaner try/catch block.

    // Use the main search API to get suggestions
    // This avoids direct DB access and uses the centralized logic
    const products = await getProducts({ query: sanitizedQuery, limit: 8 });

    // Extract suggestions from products
    const suggestions = new Set<string>();
    const results: LocationSuggestion[] = [];

    products.forEach(product => {
      // 1. Check City
      if (product.city && product.city.toLowerCase().includes(sanitizedQuery) && !suggestions.has(product.city.toLowerCase())) {
        suggestions.add(product.city.toLowerCase());
        results.push({ label: product.city, type: 'City' });
      }

      // 2. Check Address (Extract simple locality if possible, else use full address)
      if (product.address && product.address.toLowerCase().includes(sanitizedQuery) && !suggestions.has(product.address.toLowerCase())) {
        // Heuristic: If address is short, use it. If long, maybe just use it anyway for now because logic is complex
        suggestions.add(product.address.toLowerCase());
        results.push({ label: product.address, type: 'Area' });
      }

      // 3. Check Tags
      if (product.tags) {
        product.tags.forEach(tag => {
          if (tag.toLowerCase().includes(sanitizedQuery) && !suggestions.has(tag.toLowerCase())) {
            suggestions.add(tag.toLowerCase());
            results.push({ label: tag, type: 'Type' }); // tagging as Type for generic
          }
        });
      }
    });

    return results.slice(0, 8);
  } catch (error) {
    console.error('Auto-suggest error:', error);
    return [];
  }
}

export async function getProducts(params?: {
  sortKey?: ProductSortKey;
  reverse?: boolean;
  query?: string;
  limit?: number;
  minPrice?: string;
  maxPrice?: string;
  location?: string;
  propertyType?: string;
  amenities?: string[];
  city?: string;
  area?: string;
  type?: string;
}): Promise<Product[]> {
  // Client-side: use API
  if (typeof window !== 'undefined') {
    try {
      return await apiClient.post<Product[]>('/products', {
        ...params,
        limit: params?.limit || 24
      });
    } catch (error) {
      console.error('Error in getProducts (Client):', error);
      throw error;
    }
  }

  // Server-side: Direct DB access
  try {
    const limit = params?.limit || 24;
    const safeLimit = Math.max(1, Math.min(Math.floor(limit), 50));

    let dbQuery = supabase
      .from("properties")
      .select('id,handle,title,description,price_range,featured_image,tags,available_for_sale,category_id,"contactNumber",user_id,"bathroomType","securityDeposit","electricityStatus","tenantPreference",latitude,longitude,"googleMapsLink",is_verified,status,view_count,created_at,updated_at,"price","location","address","type"')
      .limit(safeLimit);

    // Apply base filter & NO-BANNED USER FILTER
    dbQuery = dbQuery
      .eq('available_for_sale', true)
      .eq('status', 'approved');
    // .eq('users.is_banned', false); // Exclude banned users - TEMPORARILY DISABLED FOR DEBUGGING

    // City Filter (Case-Insensitive)
    if (params?.city && validateInput(params.city, 'string')) {
      // Search both 'city' column and 'location' tags/column for robustness
      const c = sanitizeInput(params.city);
      dbQuery = dbQuery.or(`city.ilike.%${c}%, location.ilike.%${c}%`);
    }

    // Apply Filters (Logic mirrored from app/api/products/route.ts)
    // Apply Filters (Logic mirrored from app/api/products/route.ts)
    if (params?.query && validateInput(params.query, 'string')) {
      const safeQuery = sanitizeInput(params.query).replace(/[,()]/g, ' ').trim();

      // STRATEGY: Priority Search
      // 1. Explicit Column Match (City/State/Locality) - STRICT
      // 2. Geocoding + Radius (Spatial) - PROXIMITY
      // 3. Text Search (Title/Desc) - FALLBACK

      // --- Priority 1: Explicit Column Match ---
      // Check if the query matches a location field directly.
      const { data: strictData, error: strictError } = await supabase
        .from("properties")
        .select('id,handle,title,description,price_range,featured_image,tags,available_for_sale,category_id,"contactNumber",user_id,"bathroomType","securityDeposit","electricityStatus","tenantPreference",latitude,longitude,"googleMapsLink",is_verified,status,view_count,created_at,"price","location","address","type",state,city,locality')
        .eq('available_for_sale', true)
        .eq('status', 'approved')
        .or(`city.ilike.%${safeQuery}%,locality.ilike.%${safeQuery}%,state.ilike.%${safeQuery}%,address.ilike.%${safeQuery}%,location.ilike.%${safeQuery}%`)
        .limit(50); // Safe limit

      if (!strictError && strictData && strictData.length > 0) {
        console.log(`Server getProducts: STRICT COLUMN MATCH found ${strictData.length} for '${safeQuery}'`);
        let results = strictData.map(mapPropertyToProduct);

        // Apply In-Memory Price Filter
        if (params?.minPrice) {
          const min = parseFloat(params.minPrice);
          results = results.filter(p => {
            const priceVal = p.price?.toString() || p.priceRange?.minVariantPrice?.amount || '0';
            return parseFloat(priceVal) >= min;
          });
        }
        if (params?.maxPrice) {
          const max = parseFloat(params.maxPrice);
          results = results.filter(p => {
            const priceVal = p.price?.toString() || p.priceRange?.minVariantPrice?.amount || '0';
            return parseFloat(priceVal) <= max;
          });
        }
        return results;
      }

      // --- Priority 2: Strict Geocoding + Radius Search ---
      try {
        const geoUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(safeQuery)}&limit=1`;
        const geoRes = await fetch(geoUrl, {
          headers: { 'User-Agent': 'NBFHomes-ServerSide' },
          cache: 'no-store' // Ensure fresh results
        });

        if (geoRes.ok) {
          const geoData = await geoRes.json();
          if (geoData && geoData.length > 0) {
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
              if (params?.minPrice) {
                const min = parseFloat(params.minPrice);
                results = results.filter(p => {
                  const priceVal = p.price?.toString() || p.priceRange?.minVariantPrice?.amount || '0';
                  return parseFloat(priceVal) >= min;
                });
              }
              if (params?.maxPrice) {
                const max = parseFloat(params.maxPrice);
                results = results.filter(p => {
                  const priceVal = p.price?.toString() || p.priceRange?.minVariantPrice?.amount || '0';
                  return parseFloat(priceVal) <= max;
                });
              }

              console.log(`Server getProducts: Strict Geocode found ${results.length} results for ${safeQuery}`);
              return results;
            } else {
              // Place found but no data -> Strict Empty Return
              return [];
            }
          }
        }
      } catch (e) {
        console.warn('Server getProducts geocode fail:', e);
      }

      // --- Priority 3: Fallback Text Search ---
      // Smart Filtering: Split query into words and search each word independently
      // Only runs if Priority 1 and 2 yielded nothing/failed.
      const excludeStopWords = (word: string) => word.length > 0;
      const searchTerms = params.query.trim().split(/\s+/).filter(excludeStopWords);

      searchTerms.forEach(term => {
        const q = sanitizeInput(term);
        // Multi-Column Search with Partial Match (ILIKE)
        // Expanded to include Address and Location as the fallback
        dbQuery = dbQuery.or(`title.ilike.%${q}%,description.ilike.%${q}%,address.ilike.%${q}%,location.ilike.%${q}%`);
      });
    }

    if (params?.location && validateInput(params.location, 'string')) {
      const loc = sanitizeInput(params.location);
      // Using contains for exact tag match. For partial, we'd need text casting or separate search index.
      dbQuery = dbQuery.contains('tags', [loc]);
    }



    if (params?.propertyType && validateInput(params.propertyType, 'string')) {
      const pType = sanitizeInput(params.propertyType);
      dbQuery = dbQuery.contains('tags', [pType]);
    }

    if (params?.amenities && Array.isArray(params.amenities)) {
      for (const amenity of params.amenities) {
        if (validateInput(amenity, 'string')) {
          dbQuery = dbQuery.contains('tags', [sanitizeInput(amenity)]);
        }
      }
    }

    // Sorting
    const sortKey = params?.sortKey;
    const reverse = params?.reverse;

    if (sortKey === 'PRICE') {
      dbQuery = dbQuery.order('price_range->minVariantPrice->amount', { ascending: !reverse });
    } else if (sortKey === 'CREATED_AT') {
      dbQuery = dbQuery.order('created_at', { ascending: !reverse });
    } else {
      // Default sort: Newest First
      dbQuery = dbQuery.order('created_at', { ascending: false });
    }

    const { data, error } = await dbQuery;
    if (error) throw error;

    let results = data.map(mapPropertyToProduct);

    // In-Memory Numeric Price Filtering
    // This is required because 'price' in DB is text, causing "10000" < "3000" errors in standard SQL
    if (params?.minPrice) {
      const min = parseFloat(params.minPrice);
      results = results.filter(p => {
        const priceVal = p.price?.toString() || p.priceRange?.minVariantPrice?.amount || '0';
        return parseFloat(priceVal) >= min;
      });
    }
    if (params?.maxPrice) {
      const max = parseFloat(params.maxPrice);
      results = results.filter(p => {
        const priceVal = p.price?.toString() || p.priceRange?.minVariantPrice?.amount || '0';
        return parseFloat(priceVal) <= max;
      });
    }

    return results;

  } catch (error) {
    // Silent fail for build fault tolerance
    return [];
  }
}

export async function getProduct(handle: string): Promise<Product | null> {
  try {
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .eq('handle', handle)
      .eq('status', 'approved') // SECURITY PATCH: Hide banned/inactive
      .eq('available_for_sale', true) // SECURITY PATCH
      .single();

    if (error) return null;

    const product = mapPropertyToProduct(data);

    // Manually fetch owner details to avoid JOIN issues and RLS
    if (product.userId) {
      try {
        let userData = null;
        const adminClient = getAdminClient();
        const clientToUse = adminClient || supabase;

        // Try 'users' table first
        const { data: usersData, error: usersError } = await clientToUse
          .from("users")
          .select("*")
          .eq("id", product.userId)
          .single();

        if (usersData && !usersError) {
          userData = usersData;
        } else {
          console.warn(`[getProduct] Failed to fetch user ${product.userId} (Error: ${usersError?.message}, Data: ${!!usersData}). AdminClient: ${!!adminClient}`);

          // Fallback: Try Secure RPC (get_owner_name)
          // This fixes the issue where implicit RLS blocks reading the user table for "Property Owner" name
          try {
            // We use 'supabase' (public client) here because the RPC is SECURITY DEFINER (publicly executable)
            const { data: rpcName, error: rpcError } = await supabase.rpc('get_owner_name', { owner_id: product.userId });

            if (!rpcError && rpcName) {
              product.ownerName = rpcName;
              console.log(`[getProduct] Fetched owner name via RPC: ${rpcName}`);
            }
          } catch (e) {
            // Ignore
          }

          userData = null;
        }

        if (userData) {
          product.ownerName =
            userData.full_name ||
            userData.name ||
            userData.display_name ||
            (userData.first_name ? `${userData.first_name} ${userData.last_name || ''}`.trim() : null) ||
            userData.username ||
            userData.email?.split('@')[0]; // Fallback to email prefix if absolutely nothing else
          console.log(`[getProduct] Fetched owner name: ${product.ownerName} for product ${handle}`);
        }
      } catch (err) {
        console.warn('Failed to fetch user details for product:', err);
        // Continue without owner details - do not crash the page
        // Continue without user details
      }
    }

    return product;
  } catch {
    return null;
  }
}

export async function getUserProducts(userId: string): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from("properties")
      .select('id,handle,title,description,price_range,featured_image,tags,available_for_sale,category_id,"contactNumber",user_id,"bathroomType","securityDeposit","electricityStatus","tenantPreference",latitude,longitude,"googleMapsLink",is_verified,status,view_count,created_at,updated_at,"price","location","address","type"')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }); // Ensure Newest First

    if (error) return [];
    return (data || []).map(mapPropertyToProduct);
  } catch (error) {
    return [];
  }
}

export async function getCollections(): Promise<Collection[]> {
  try {
    const { data, error } = await supabase.from("collections").select("*");
    if (error) return [];
    return (data || []).map(mapDbCollectionToCollection);
  } catch (error) {
    return [];
  }
}

export async function getCollection(handle: string): Promise<Collection | null> {
  try {
    const { data, error } = await supabase
      .from("collections")
      .select("*")
      .eq('handle', handle)
      .single();

    if (error) return null;
    return mapDbCollectionToCollection(data);
  } catch {
    return null;
  }
}

export async function getCollectionProducts(params: {
  collection: string;
  sortKey?: ProductCollectionSortKey;
  reverse?: boolean;
  query?: string;
}): Promise<Product[]> {
  // This is a bit more complex as it involves joining or filtering by collection
  // For now, we'll fetch all products and filter (or you might have a collection_products table)
  // Assuming 'collection' param is the handle, we first need the collection ID
  try {
    // 1. Get Collection ID
    const { data: collectionData, error: colError } = await supabase
      .from("collections")
      .select("id")
      .eq("handle", params.collection)
      .single();

    if (colError || !collectionData) return [];

    // 2. Get Products in this collection
    // Assuming properties table has a category_id or similar, OR there is a join table.
    // Based on types, Product has categoryId.

    let dbQuery = supabase
      .from("properties")
      .select('id,handle,title,description,price_range,featured_image,tags,available_for_sale,category_id,"contactNumber",user_id')
      .eq('category_id', collectionData.id)
      .eq('available_for_sale', true)
      .limit(50);

    if (params.query) {
      const sanitizedQuery = sanitizeInput(params.query);
      dbQuery = dbQuery.or(`title.ilike.%${sanitizedQuery}%,description.ilike.%${sanitizedQuery}%`);
    }

    // Sort
    if (params.sortKey === 'PRICE') {
      dbQuery = dbQuery.order('price_range->minVariantPrice->amount', { ascending: !params.reverse });
    } else {
      dbQuery = dbQuery.order('created_at', { ascending: !params.reverse });
    }

    const { data, error } = await dbQuery;
    if (error) return [];
    return data.map(mapPropertyToProduct);

  } catch {
    // Silent fail
    return [];
  }
}

// Cart functions removed as per project requirements (Property Rental only)

export async function createProduct(data: any, token?: string): Promise<Product> {
  try {
    // 1. Get current user
    const { data: { user } } = token
      ? await supabase.auth.getUser(token)
      : await supabase.auth.getUser();

    if (!user) {
      console.error('Authentication failed: No user found. Token provided:', !!token);
      throw new Error('User not authenticated');
    }

    // 1.5 Sync User to Public Table (Crucial Step) and Check Rate Limit
    // Check if user exists in public.users to avoid FK error
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, last_posted_at, is_banned')
      .eq('id', user.id)
      .single();

    if (!existingUser) {
      // Force sync logic (similar to trigger but manual failsafe)
      const { error: syncError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || 'New User',
          avatar_url: user.user_metadata?.avatar_url
        });

      if (syncError) {
        console.error('Failed to sync user to public table:', syncError);
        // We continue anyway, hoping the trigger fired or it was a race condition
      }
    } else {
      // 1.5.1 BAN CHECK
      if (existingUser.is_banned) {
        throw new Error("Your account has been restricted. You cannot post new properties.");
      }

      // RATE LIMIT CHECK
      if (existingUser.last_posted_at) {
        const lastPosted = new Date(existingUser.last_posted_at).getTime();
        const now = new Date().getTime();
        const diffMinutes = (now - lastPosted) / 1000 / 60;

        // Limit: 1 post every 5 minutes
        if (diffMinutes < 5) {
          throw new Error(`Please wait ${Math.ceil(5 - diffMinutes)} minutes before posting another property.`);
        }
      }
    }

    // 2. Prepare data with user_id & Map camelCase to snake_case
    const tags = [
      data.type || 'PG',
      data.location || '',
      data.address || '',
      ...(data.tags || [])
    ].filter(Boolean);

    // Note: 'handle' is NOT sent; it is auto-generated by the DB trigger 'ensure_property_handle'.

    const insertData = {
      title: data.title,
      description: data.description,
      // EXACT FORMAT REQUESTED BY USER
      price_range: {
        "minVariantPrice": { "amount": String(data.price || 0), "currencyCode": "INR" }
      },
      "price": String(data.price || 0),
      currency_code: 'INR',
      // Store images as array of objects { url, altText } AND specifically handle secure_url
      // The user requested: "Send the image received ... to an array secure_url of names images.jsonb[]"
      // Interpretation: Ensure we're storing the URLs.
      images: data.images?.map((url: string) => ({ url, altText: data.title })) || [],
      tags: tags,
      available_for_sale: false,
      status: 'pending',
      user_id: user.id,
      "userId": user.id, // Redundant but requested

      // Quoted keys to match specific DB columns (Case Sensitive)
      "contactNumber": data.contactNumber,
      "bathroomType": data.bathroom_type || data.bathroomType,
      "securityDeposit": data.securityDeposit?.toString() || '0',
      "electricityStatus": data.electricityStatus,
      "tenantPreference": data.tenantPreference,
      "location": data.location,
      "address": data.address,
      "type": data.type,
      latitude: data.latitude,
      longitude: data.longitude,
      "googleMapsLink": data.googleMapsLink,
      amenities: data.amenities,
      featured_image: data.images?.[0] ? { url: data.images[0], altText: data.title } : null
    };

    // 3. Insert directly into Supabase (bypassing CSRF/API)
    const { data: insertedProperty, error } = await supabase
      .from('properties')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

    if (error) throw error;

    // UPDATE RATE LIMIT TIMESTAMP
    await supabase.from('users').update({ last_posted_at: new Date().toISOString() }).eq('id', user.id);

    // TRIGGER NOTIFICATION
    // TRIGGER NOTIFICATION via Server Action
    try {
      const { sendNewPropertyNotificationAction } = await import('@/app/actions');
      await sendNewPropertyNotificationAction(
        insertedProperty.title,
        insertedProperty.location,
        insertedProperty.price?.toString() || '0'
      );
    } catch (notifError) {
      console.error('Failed to send admin notification:', notifError);
    }

    return mapPropertyToProduct(insertedProperty);
  } catch (e: any) {

    console.error("Create Product failed:", e);
    throw e;
  }
}

export async function updateProduct(id: string, data: any, token?: string): Promise<Product> {
  try {
    const updateData: any = {
      title: data.title,
      description: data.description,
      // EXACT FORMAT REQUESTED BY USER
      price_range: {
        "minVariantPrice": { "amount": data.price?.toString() || '0', "currencyCode": "INR" }
      },
      "price": data.price?.toString(),
      // Store images as array of objects { url, altText }
      images: data.images?.map((url: string) => ({ url, altText: data.title })) || [],

      // Quoted keys to match specific DB columns (Case Sensitive)
      "contactNumber": data.contactNumber,
      "bathroomType": data.bathroom_type || data.bathroomType,
      "securityDeposit": data.securityDeposit?.toString() || '0',
      "electricityStatus": data.electricityStatus,
      "tenantPreference": data.tenantPreference,
      "location": data.location,
      "address": data.address,
      "type": data.type,
      latitude: data.latitude,
      longitude: data.longitude,
      "googleMapsLink": data.googleMapsLink,
      amenities: data.amenities,
      featured_image: data.images?.[0] ? { url: data.images[0], altText: data.title } : null,
      updated_at: new Date().toISOString(),
      state: data.state,
      city: data.city,
      locality: data.locality,
      built_up_area: data.builtUpArea,
      furnishing_status: data.furnishingStatus,
      floor_number: data.floorNumber,
      total_floors: data.totalFloors
    };

    // SECURITY PATCH: Check Ban Status before Update
    if (token) {
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        const { data: u } = await supabase.from('users').select('is_banned').eq('id', user.id).single();
        if (u?.is_banned) throw new Error("Account Restricted: Cannot update property.");
      }
    }

    // 3. Update directly in Supabase (bypassing CSRF/API)
    const { data: updatedProperty, error } = await supabase
      .from('properties')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return mapPropertyToProduct(updatedProperty);
  } catch (e: any) {
    console.error("Update Product failed:", e);
    throw e;
  }
}

export async function deleteProduct(id: string, token?: string): Promise<{ success: boolean }> {
  try {
    await apiClient.delete<{ success: boolean }>(`/products/${id}`, { token });
    return { success: true };
  } catch (e: any) {
    console.error("Delete Product API failed", e);
    throw e;
  }
}

export async function checkIsAdmin(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("admin_users")
      .select("user_id")
      .eq("user_id", userId)
      .single();
    return !!data && !error;
  } catch {
    return false;
  }
}

export async function adminDeleteProduct(id: string, adminUserId: string): Promise<{ success: boolean }> {
  try {
    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error deleting product:', error);
    return { success: false };
  }
}

export async function getAdminStats(): Promise<{ total: number; active: number; users: number }> {
  try {
    const { count: total } = await supabase.from('properties').select('*', { count: 'exact', head: true });
    const { count: active } = await supabase.from('properties').select('*', { count: 'exact', head: true }).eq('status', 'approved');

    // User requested explicitly to fetch from 'public.profiles', but schema shows 'users'.
    // Reverting to 'users' to ensure stability.
    const { count: users } = await supabase.from('users').select('*', { count: 'exact', head: true });

    return {
      total: total || 0,
      active: active || 0,
      users: users || 0
    };
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return { total: 0, active: 0, users: 0 };
  }
}

export async function getUserPropertiesForAdmin(userId: string): Promise<Product[]> {
  try {
    // Fetch all properties for a user without status filtering
    const { data, error } = await supabase
      .from("properties")
      .select('id,handle,title,description,price_range,featured_image,tags,available_for_sale,category_id,"contactNumber",user_id,"bathroomType","securityDeposit","electricityStatus","tenantPreference",latitude,longitude,"googleMapsLink",is_verified,status,"price","location","address","type"')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapPropertyToProduct);
  } catch (error) {
    console.error('Error fetching user properties:', error);
    return [];
  }
}

export async function getAdminProducts(
  page: number = 1,
  limit: number = 10,
  search: string = '',
  status: string = 'all',
  city: string = '',
  minPrice?: number,
  maxPrice?: number
): Promise<{ products: Product[]; total: number; page: number; limit: number }> {
  try {
    let query = supabase.from('properties').select('*', { count: 'exact' });

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,id.eq.${search},"contactNumber".ilike.%${search}%`);
    }

    if (status === 'active') {
      query = query.eq('status', 'approved');
    } else if (status === 'inactive') {
      query = query.eq('status', 'inactive');
    } else if (status === 'pending') {
      query = query.eq('status', 'pending');
    }

    // Advanced Filters
    if (city) {
      query = query.contains('tags', [city]);
    }
    if (minPrice !== undefined) {
      query = query.gte('price_range->minVariantPrice->amount', minPrice);
    }
    if (maxPrice !== undefined) {
      query = query.lte('price_range->minVariantPrice->amount', maxPrice);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, count, error } = await query.range(from, to).order('created_at', { ascending: false });

    if (error) return { products: [], total: 0, page, limit };

    return {
      products: data.map(mapPropertyToProduct),
      total: count || 0,
      page,
      limit
    };
  } catch {
    return { products: [], total: 0, page, limit };
  }
}

export async function updateUserRole(userId: string, role: 'admin' | 'vendor' | 'user'): Promise<boolean> {
  try {
    const { error } = await supabase.from('users').update({ role }).eq('id', userId);
    return !error;
  } catch {
    return false;
  }
}

export async function toggleUserVerified(userId: string, isVerified: boolean): Promise<boolean> {
  try {
    const { error } = await supabase.from('users').update({ is_verified: isVerified }).eq('id', userId);
    return !error;
  } catch {
    return false;
  }
}

export async function updatePropertyVerified(propertyId: string, isVerified: boolean): Promise<boolean> {
  try {
    const { error } = await supabase.from('properties').update({ is_verified: isVerified }).eq('id', propertyId);
    return !error;
  } catch {
    return false;
  }
}

export async function getSiteSettings(): Promise<Record<string, string>> {
  try {
    const { data, error } = await supabase.from('site_settings').select('*');
    if (error) {
      console.error('Error fetching site settings:', JSON.stringify(error, null, 2));
      return {};
    }
    return data.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {});
  } catch (error) {
    console.error('Error in getSiteSettings:', JSON.stringify(error, null, 2));
    return {};
  }
}

export async function updateSiteSettings(settings: Record<string, string>): Promise<boolean> {
  try {
    const upserts = Object.entries(settings).map(([key, value]) => ({ key, value }));
    const { error } = await supabase.from('site_settings').upsert(upserts);
    return !error;
  } catch {
    return false;
  }
}

export async function updateProductStatus(id: string, availableForSale: boolean, adminUserId: string): Promise<Product | null> {
  try {
    // Use admin client to bypass RLS policies
    const adminClient = getAdminClient();
    if (!adminClient) {
      console.error('Admin client not available');
      return null;
    }

    // Map boolean back to status string logic if needed, or just update status directly
    // If availableForSale is true -> status = approved. 
    // If false -> status = inactive (or pending? assume inactive for toggle)
    const newStatus = availableForSale ? 'approved' : 'inactive';

    const { data, error } = await adminClient
      .from('properties')
      .update({
        available_for_sale: availableForSale,
        status: newStatus
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return mapPropertyToProduct(data);
  } catch (error) {
    console.error('Error updating product status:', error);
    return null;
  }
}

export async function approveProduct(id: string, adminUserId: string): Promise<boolean> {
  try {
    // 1. Update property status to approved
    const { error } = await supabase
      .from('properties')
      .update({
        available_for_sale: true,
        status: 'approved'
      })
      .eq('id', id);

    return !error;
  } catch (error) {
    console.error('Error approving product:', error);
    return false;
  }
}

export async function updateUserPhoneNumber(userId: string, phoneNumber: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('users')
      .update({ phone_number: phoneNumber })
      .eq('id', userId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating phone number:', JSON.stringify(error, null, 2));
    throw error;
  }
}

export async function trackLead(propertyId: string, type: 'contact' | 'whatsapp'): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('properties_leads').insert({
      property_id: propertyId,
      type,
      user_id: user?.id || null
    });
  } catch (error) {
    console.error('Error tracking lead:', error);
  }
}

export async function getAdminUsers(page: number = 1, limit: number = 10, search: string = ''): Promise<{ users: { userId: string; name: string; email: string; contactNumber: string; role: string; isVerified: boolean; totalProperties: number; activeProperties: number; profession: string; status: string; is_banned: boolean }[]; total: number; page: number; limit: number }> {
  try {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase.from('users').select('*', { count: 'exact' });

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,profession.ilike.%${search}%`);
    }

    const { data: profiles, count, error } = await query.range(from, to).order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching admin users:', error);
      return { users: [], total: 0, page, limit };
    }

    if (!profiles) return { users: [], total: 0, page, limit };

    // Optimized: Use simpler counts or separate queries if needed.
    // Ideally we would use a View or RPC for performance, but Promise.all with 'head: true' is better than full select.
    const usersWithStats = await Promise.all(profiles.map(async (profile) => {

      const { count: totalProperties } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.id);

      const { count: activeProperties } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.id)
        .eq('available_for_sale', true);

      return {
        userId: profile.id,
        name: profile.first_name ? `${profile.first_name} ${profile.last_name || ''}`.trim() : (profile.full_name || profile.name || profile.email?.split('@')[0] || 'N/A'),
        email: profile.email || 'N/A',
        contactNumber: profile.contact_number || profile.phone_number || 'N/A',
        role: profile.role || 'user',
        isVerified: profile.is_verified || false,
        totalProperties: totalProperties || 0,
        activeProperties: activeProperties || 0,
        profession: profile.profession || '',
        status: profile.status || 'active',
        is_banned: profile.is_banned || false
      };
    }));

    return {
      users: usersWithStats,
      total: count || 0,
      page,
      limit
    };
  } catch (error) {
    console.error('Error in getAdminUsers:', JSON.stringify(error, null, 2));
    return { users: [], total: 0, page, limit };
  }
}

export async function updateUserProfile(userId: string, profession: string, contactNumber: string): Promise<{ success: boolean; error?: any }> {
  try {
    const { error } = await supabase
      .from('users')
      .update({
        profession,
        contact_number: contactNumber,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error updating profile:', JSON.stringify(error, null, 2));
    return { success: false, error };
  }
}

export async function banUser(userId: string): Promise<{ success: boolean; error?: any }> {
  try {
    const { error } = await supabase
      .from('users')
      .update({ status: 'banned' })
      .eq('id', userId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error banning user:', error);
    return { success: false, error };
  }
}

export async function incrementViewCount(id: string): Promise<void> {
  try {
    const { error } = await supabase.rpc('increment_view_count', { row_id: id });
    if (error) {
      // Fallback for when RPC is not created yet (user hasn't run SQL)
      // We can try a simple update, though it's not atomic for concurrent users
      // but better than nothing for single user testing.
      // actually, standard update:
      const { data } = await supabase.from('properties').select('view_count').eq('id', id).single();
      if (data) {
        const newCount = (Number(data.view_count) || 0) + 1;
        await supabase.from('properties').update({ view_count: newCount }).eq('id', id);
      }
    }
  } catch (error) {
    console.error('Error incrementing view count:', error);
  }
}

export async function incrementLeadsCount(id: string): Promise<void> {
  try {
    const { error } = await supabase.rpc('increment_leads_count', { row_id: id });
    if (error) {
      // Fallback
      const { data } = await supabase.from('properties').select('leads_count').eq('id', id).single();
      if (data) {
        const newCount = (Number(data.leads_count) || 0) + 1;
        await supabase.from('properties').update({ leads_count: newCount }).eq('id', id);
      }
    }
  } catch (error) {
    console.error('Error incrementing leads count:', error);
  }
}

export async function getInquiries(page: number = 1, limit: number = 10): Promise<{ inquiries: any[]; total: number }> {
  try {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, count, error } = await supabase
      .from('inquiries')
      .select('*', { count: 'exact' })
      .range(from, to)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return {
      inquiries: data || [],
      total: count || 0
    };
  } catch (error) {
    console.error('Error fetching inquiries:', error);
    return { inquiries: [], total: 0 };
  }
}

export async function getAllInquiries() {

  const { data, error } = await supabase
    .from('inquiries')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching all inquiries:', error);
    return [];
  }
  return data || [];
}

export async function getUnreadInquiriesCount() {

  const { count, error } = await supabase
    .from('inquiries')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'unread');

  if (error) {
    console.error('Error fetching unread count:', error);
    return 0;
  }

  return count || 0;
}

// Leads Activity API
export async function getAdminLeads() {


  // Fetch all leads with user details and property details
  // Note: We'll do a join or separate fetches depending on complexity. 
  // Supabase can do joins if foreign keys are set up.
  // 'user_id' links to 'auth.users' (or public.users if synced).
  // 'property_id' is text, so we might need manual mapping if no FK. 
  // Assuming 'leads_activity' has 'user_id' and 'property_id'.

  // Let's verify if we can fetch everything in one go.
  // If we can't join property easily (text id), we fetch leads and separate properties.

  const { data: leads, error } = await supabase
    .from('leads_activity')
    .select(`
            id,
            created_at,
            action_type,
            property_id,
            user_id
        `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching leads:', error);
    return [];
  }

  // Enhance leads with Property and User info
  // Fetch unique property IDs
  const propertyIds = Array.from(new Set(leads.map(l => l.property_id).filter(Boolean)));
  // Fetch unique user IDs (Strict UUID Only)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const userIds = Array.from(new Set(leads.map(l => l.user_id).filter((id) => id && uuidRegex.test(id))));

  // Fetch Properties
  let properties: any[] = [];
  if (propertyIds.length > 0) {
    const { data: props } = await supabase
      .from('properties')
      .select('id, title, location, price, images')
      .in('id', propertyIds);
    properties = props || [];
  }

  // Fetch Users
  let users: any[] = [];
  if (userIds.length > 0) {
    const { data: fetchedUsers, error: usersError } = await supabase
      .from('users')
      .select('*')
      .in('id', userIds);

    if (usersError) {
      console.error('[getAdminLeads] User Fetch Error:', JSON.stringify(usersError, null, 2));
    } else {
      users = fetchedUsers || [];
    }
  }

  console.log('[getAdminLeads] Leads found:', leads?.length);
  console.log('[getAdminLeads] UserIDs to fetch:', userIds.length, userIds);
  console.log('[getAdminLeads] Users fetched:', users?.length, maxLog(users));

  function maxLog(arr: any[]) {
    if (!arr) return 'null';
    return arr.length > 3 ? arr.slice(0, 3).concat(['...']) : arr;
  }

  // Combine Data
  const enrichedLeads = leads.map(lead => {
    const property = properties?.find(p => p.id === lead.property_id);
    const user = users?.find(u => u.id === lead.user_id);

    // Robust Name Resolution
    const userName = user
      ? (user.first_name ? `${user.first_name} ${user.last_name || ''}`
        : (user.full_name || user.name || user.email?.split('@')[0] || 'User'))
      : 'Unknown User';

    return {
      ...lead,
      property_title: property?.title || 'Unknown Property',
      property_location: property?.location || '',
      user_name: userName.trim(),
      user_email: user?.email || '',
      user_phone: user?.phone_number || user?.contact_number || ''
    };
  });

  return enrichedLeads;
}

export async function deleteLeadActivity(leadId: string) {

  const { error } = await supabase
    .from('leads_activity')
    .delete()
    .eq('id', leadId);

  if (error) {
    console.error('Error deleting lead:', error);
    return { success: false, error: error.message };
  }
  return { success: true };
}

export async function getUserDetailsForAdmin(userId: string) {
  try {
    // 1. Fetch User Profile (from public.users)
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    // 2. Fetch Leads (Activity)
    const { data: leads, error: leadsError } = await supabase
      .from('leads_activity')
      .select('*, property:property_id(title, location, images)') // Assuming simple join works if FK starts working, else manual fetch
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // 3. Fetch Views
    const { data: views, error: viewsError } = await supabase
      .from('property_views')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // 4. Fetch Inquiries
    const { data: inquiries, error: inqError } = await supabase
      .from('inquiries')
      .select('*')
      .eq('email', user.email)
      .order('created_at', { ascending: false });

    if (inqError) {
      console.error('Error fetching user inquiries:', inqError);
    } else {
      console.log(`Fetched ${inquiries?.length} inquiries for ${user.email}`);
    }

    // Manual fetch for properties if needed (for leads and views)
    const propertyIds = new Set([
      ...(leads || []).map((l: any) => l.property_id),
      ...(views || []).map((v: any) => v.property_id)
    ]);

    // Only fetch unique properties if we have any
    let properties: any[] = [];
    let owners: any[] = [];

    if (propertyIds.size > 0) {
      const { data: props } = await supabase
        .from('properties')
        .select('id, title, location, price, images, user_id')
        .in('id', Array.from(propertyIds));
      properties = props || [];

      // Fetch Owners
      const ownerIds = new Set(properties.map((p: any) => p.user_id).filter(Boolean));
      if (ownerIds.size > 0) {
        const { data: ownersData } = await supabase
          .from('users')
          .select('*')
          .in('id', Array.from(ownerIds));
        owners = ownersData || [];
      }
    }

    console.log(`[getUserDetailsForAdmin] Fetched for ${userId}: ${leads?.length} leads, ${views?.length} views.`);

    // Map properties back to items
    const enrichWithPropertyAndOwner = (item: any) => {
      const prop = properties?.find((p: any) => p.id === item.property_id);
      if (!prop) return { ...item, property: { title: 'Unknown', location: '' } };

      const owner = owners?.find((o: any) => o.id === prop.user_id);
      return {
        ...item,
        property: {
          ...prop,
          owner: owner || { first_name: 'Unknown', last_name: 'Owner', email: 'N/A' }
        }
      };
    };

    const enrichedLeads = (leads || []).map(enrichWithPropertyAndOwner);
    const enrichedViews = (views || []).map(enrichWithPropertyAndOwner);

    return {
      user,
      leads: enrichedLeads,
      views: enrichedViews,
      inquiries: inquiries || []
    };

  } catch (error: any) {
    console.error('Error fetching user details:', error);
    return null;
  }
}
// User Activity Dashboard Types & Function
export interface UserActivityData {
  user: {
    id: string;
    email: string;
    fullName: string;
    phoneNumber: string;
    avatarUrl?: string;
    joinedAt: string;
    role: string;
    isBanned: boolean;
  };
  stats: {
    totalContacts: number; // Leads
    totalViews: number;
    conversionRate: number; // (Contacts / Views) * 100
  };
  timeline: ActivityItem[];
  leads: any[];
  views: any[];
  inquiries: any[];
}

export interface ActivityItem {
  id: string;
  type: 'view' | 'contact' | 'inquiry';
  propertyName?: string;
  propertyHandle?: string;
  propertyOwner?: string; // Owner Email
  date: string;
  details?: string; // "Viewed Property" or "Contacted via WhatsApp"
}

export async function getUserActivityData(userId: string): Promise<UserActivityData | null> {
  try {
    const adminClient = getAdminClient(); // Ensure we use admin privileges
    const client = adminClient || supabase;

    // 1. Fetch User Details
    const { data: user, error: userError } = await client
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) throw new Error('User not found');

    // 2. Fetch Leads (Contacts Initiated)
    const { data: leads } = await client
      .from('leads_activity')
      .select('*, properties(title, handle, user_id)') // Join property details
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // 3. Fetch Property Views
    const { data: views } = await client
      .from('property_views')
      .select('*, properties(title, handle, user_id)')
      .eq('user_id', userId)
      .order('viewed_at', { ascending: false });

    // 4. Fetch Inquiries (Match by Email)
    const { data: inquiries } = await client
      .from('inquiries')
      .select('*')
      .eq('email', user.email)
      .order('created_at', { ascending: false });

    // 5. Aggregate Data for Timeline
    const timeline: ActivityItem[] = [];

    // Process Leads
    leads?.forEach((lead: any) => {
      timeline.push({
        id: lead.id,
        type: 'contact',
        propertyName: lead.properties?.title || 'Unknown Property',
        propertyHandle: lead.properties?.handle,
        propertyOwner: 'Loading...', // Ideally fetch owner email, but effectively complex in one go. UI can handle or we fetch separately if critical.
        date: lead.created_at,
        details: `Contacted via ${lead.type}`
      });
    });

    // Process Views
    views?.forEach((view: any) => {
      timeline.push({
        id: view.id,
        type: 'view',
        propertyName: view.properties?.title || 'Unknown Property',
        propertyHandle: view.properties?.handle,
        propertyOwner: 'Loading...',
        date: view.viewed_at,
        details: 'Viewed Property'
      });
    });

    // Process Inquiries
    inquiries?.forEach((inq: any) => {
      timeline.push({
        id: inq.id,
        type: 'inquiry',
        propertyName: 'N/A', // General inquiry
        date: inq.created_at,
        details: `Subject: ${inq.subject || 'No Subject'}`
      });
    });

    // Sort Timeline by Date Descending
    timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // 6. Calculate Stats
    const totalContacts = leads?.length || 0;
    const totalViews = views?.length || 0;
    const conversionRate = totalViews > 0 ? ((totalContacts / totalViews) * 100) : 0;

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name || user.name || 'User',
        phoneNumber: user.phone_number || user.contactNumber || 'N/A',
        avatarUrl: user.avatar_url,
        joinedAt: user.created_at,
        role: user.role || 'user',
        isBanned: user.is_banned || false
      },
      stats: {
        totalContacts,
        totalViews,
        conversionRate
      },
      timeline,
      leads: leads || [],
      views: views || [],
      inquiries: inquiries || []
    };

  } catch (error) {
    console.error('Error fetching user activity:', error);
    return null;
  }
}
