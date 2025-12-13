import { Product, Collection, ProductSortKey, ProductCollectionSortKey } from './types';
import { supabase } from './db';
import { getAdminClient } from './supabase-admin';
import { mapPropertyToProduct, mapDbCollectionToCollection } from './backend-utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || (typeof window === 'undefined' ? 'http://localhost:3000/api' : '/api');


// CSRF Token utilities - No longer needed with direct Supabase calls
// Keeping the variable for now to avoid breaking other potential imports, but it's unused
let csrfToken: string | null = null;
let csrfTokenExpiry: number | null = null;

const getCSRFToken = async (token?: string): Promise<string> => {
  return 'mock-csrf-token';
};

// Security utilities
const validateInput = (input: any, type: 'string' | 'number' | 'email' | 'url' | 'uuid' | 'boolean' | 'array'): boolean => {
  if (input === null || input === undefined) return false;

  switch (type) {
    case 'string':
      return typeof input === 'string' && input.length <= 1000 && !/<script/i.test(input);
    case 'number':
      return typeof input === 'number' && !isNaN(input) && isFinite(input);
    case 'email':
      const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
      return typeof input === 'string' && emailRegex.test(input) && input.length <= 254;
    case 'url':
      try {
        new URL(input);
        return true;
      } catch {
        return false;
      }
    case 'uuid':
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      return typeof input === 'string' && uuidRegex.test(input);
    case 'boolean':
      return typeof input === 'boolean';
    case 'array':
      return Array.isArray(input);
    default:
      return true;
  }
};

const sanitizeInput = (input: any): any => {
  if (typeof input === 'string') {
    // Remove potential script tags and dangerous characters
    return input
      .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gi, "")
      .replace(/<iframe\b[^>]*>([\s\S]*?)<\/iframe>/gi, "")
      .replace(/<object\b[^>]*>([\s\S]*?)<\/object>/gi, "")
      .replace(/<embed\b[^>]*>/gi, "")
      .replace(/<form\b[^>]*>([\s\S]*?)<\/form>/gi, "")
      .replace(/javascript:/gi, "")
      .replace(/vbscript:/gi, "")
      .replace(/data:/gi, "")
      .replace(/on\w+\s*=/gi, "")
      .replace(/[<>'"]/g, (char) => {
        const chars: Record<string, string> = {
          '<': '&lt;',
          '>': '&gt;',
          "'": '&#39;',
          '"': '&quot;'
        };
        return chars[char] || char;
      });
  } else if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  } else if (typeof input === 'object' && input !== null) {
    const sanitizedObj: any = {};
    for (const key in input) {
      if (input.hasOwnProperty(key)) {
        sanitizedObj[sanitizeInput(key)] = sanitizeInput(input[key]);
      }
    }
    return sanitizedObj;
  }
  return input;
};

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
}): Promise<Product[]> {
  try {
    const safeLimit = params?.limit && params.limit > 0 ? Math.min(params.limit, 50) : 24;

    let dbQuery = supabase
      .from("properties")
      .select("id,handle,title,description,price_range,currency_code,featured_image,tags,available_for_sale,category_id,contact_number,user_id,seo")
      .limit(safeLimit);

    // Apply base filter
    dbQuery = dbQuery.eq('available_for_sale', true);

    // Apply search and filtering
    if (params?.query) {
      const sanitizedQuery = sanitizeInput(params.query);
      dbQuery = dbQuery.or(`title.ilike.%${sanitizedQuery}%,description.ilike.%${sanitizedQuery}%`);
    }

    if (params?.minPrice) {
      dbQuery = dbQuery.gte('price_range->minVariantPrice->amount', parseFloat(params.minPrice));
    }
    if (params?.maxPrice) {
      dbQuery = dbQuery.lte('price_range->minVariantPrice->amount', parseFloat(params.maxPrice));
    }

    if (params?.location) {
      dbQuery = dbQuery.ilike('tags', `%${sanitizeInput(params.location)}%`);
    }

    if (params?.propertyType) {
      dbQuery = dbQuery.ilike('tags', `%${sanitizeInput(params.propertyType)}%`);
    }

    if (params?.amenities && Array.isArray(params.amenities)) {
      for (const amenity of params.amenities) {
        dbQuery = dbQuery.ilike('tags', `%${sanitizeInput(amenity)}%`);
      }
    }

    if (params?.sortKey === 'PRICE') {
      dbQuery = dbQuery.order('price_range->minVariantPrice->amount', { ascending: !params.reverse });
    } else if (params?.sortKey === 'CREATED_AT') {
      dbQuery = dbQuery.order('created_at', { ascending: !params.reverse });
    } else if (params?.sortKey === 'RELEVANCE' && params.query) {
      // Relevance sorting is complex in SQL, defaulting to ID for now or created_at
      dbQuery = dbQuery.order('created_at', { ascending: false });
    } else {
      dbQuery = dbQuery.order('created_at', { ascending: false });
    }

    const { data, error } = await dbQuery;

    if (error) {
      console.error('Error fetching products:', error);
      return [];
    }

    return data.map(mapPropertyToProduct);
  } catch (error) {
    console.error('Error in getProducts:', error);
    return [];
  }
}

export async function getProduct(handle: string): Promise<Product | null> {
  try {
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .eq('handle', handle)
      .single();

    if (error) return null;

    const product = mapPropertyToProduct(data);

    // Manually fetch owner details to avoid JOIN issues and RLS
    if (product.userId) {
      let userData = null;
      const adminClient = getAdminClient();
      const clientToUse = adminClient || supabase;

      // Try 'users' table first
      const { data: usersData, error: usersError } = await clientToUse
        .from("users")
        .select("*")
        .eq("id", product.userId)
        .single();

      if (usersData) {
        userData = usersData;
      } else {
        // Fallback to 'profiles' table if 'users' fails or is empty
        const { data: profilesData } = await clientToUse
          .from("profiles")
          .select("*")
          .eq("id", product.userId)
          .single();
        userData = profilesData;
      }

      if (userData) {
        product.ownerName =
          userData.full_name ||
          userData.name ||
          userData.display_name ||
          (userData.first_name ? `${userData.first_name} ${userData.last_name || ''}`.trim() : null) ||
          userData.username ||
          userData.email?.split('@')[0]; // Fallback to email prefix if absolutely nothing else
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
      .select("id,handle,title,description,price_range,currency_code,featured_image,tags,available_for_sale,category_id,contact_number,user_id,seo")
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching user products:', error);
      return [];
    }
    return data.map(mapPropertyToProduct);
  } catch (error) {
    console.error('Error in getUserProducts:', error);
    return [];
  }
}

export async function getCollections(): Promise<Collection[]> {
  try {
    const { data, error } = await supabase.from("collections").select("*");
    if (error) {
      console.error('Error fetching collections:', error);
      return [];
    }
    return data.map(mapDbCollectionToCollection);
  } catch (error) {
    console.error('Error in getCollections:', error);
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
      .select("id,handle,title,description,price_range,currency_code,featured_image,tags,available_for_sale,category_id,contact_number,user_id,seo")
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
    return [];
  }
}

// Cart functions removed as per project requirements (Property Rental only)

export async function createProduct(data: any, token?: string): Promise<Product> {
  // Validate input data
  if (!data.title || !validateInput(data.title, 'string') || data.title.length < 3 || data.title.length > 200) {
    throw new Error("Security Alert: Invalid title parameter");
  }

  if (!data.description || !validateInput(data.description, 'string') || data.description.length > 5000) {
    throw new Error("Security Alert: Invalid description parameter");
  }

  if (!data.price || !validateInput(parseFloat(data.price), 'number') || parseFloat(data.price) <= 0) {
    throw new Error("Security Alert: Invalid price parameter");
  }

  if (!data.address || !validateInput(data.address, 'string') || data.address.length > 500) {
    throw new Error("Security Alert: Invalid address parameter");
  }

  if (!data.location || !validateInput(data.location, 'string') || data.location.length > 200) {
    throw new Error("Security Alert: Invalid location parameter");
  }

  if (!data.type || !['PG', 'Flat', 'Room', 'Hostel'].includes(data.type)) {
    throw new Error("Security Alert: Invalid property type parameter");
  }

  // Validate images array (support both old imageUrl and new images array)
  const images = data.images || (data.imageUrl ? [data.imageUrl] : []);
  if (!images.length || !images.every((url: string) => validateInput(url, 'url'))) {
    throw new Error("Security Alert: Invalid image URL parameter");
  }

  if (!data.contactNumber || !validateInput(data.contactNumber, 'string') || data.contactNumber.length > 20) {
    throw new Error("Security Alert: Invalid contact number parameter");
  }

  // Sanitize data
  const sanitizedData = {
    title: sanitizeInput(data.title),
    description: sanitizeInput(data.description),
    description_html: sanitizeInput(data.description), // Simple mapping for now
    price_range: {
      minVariantPrice: { amount: sanitizeInput(data.price), currencyCode: 'INR' },
      maxVariantPrice: { amount: sanitizeInput(data.price), currencyCode: 'INR' }
    },
    // Map address/location to tags or specific fields if available
    tags: [sanitizeInput(data.type), sanitizeInput(data.location), sanitizeInput(data.address), 'pending_approval'].filter(Boolean),
    images: images.map((url: string) => ({ url: sanitizeInput(url), altText: sanitizeInput(data.title) })),
    featured_image: { url: sanitizeInput(images[0]), altText: sanitizeInput(data.title) },
    contact_number: sanitizeInput(data.contactNumber),
    available_for_sale: false, // Default to false for approval workflow
    handle: sanitizeInput(data.title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Math.random().toString(36).substring(7),
    category_id: 'joyco-root' // Default category
  };

  // Get current user for user_id
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    // @ts-ignore
    sanitizedData.user_id = user.id;
  } else if (data.userId) {
    // Fallback to passed userId
    // @ts-ignore
    sanitizedData.user_id = data.userId;
  }

  // Generate ID
  // @ts-ignore
  sanitizedData.id = crypto.randomUUID();

  // Insert into Supabase
  const { data: newProduct, error } = await supabase
    .from('properties')
    .insert([sanitizedData])
    .select()
    .single();

  if (error) {
    console.error('Error creating property:', error);
    throw new Error('Failed to create property: ' + error.message);
  }

  return mapPropertyToProduct(newProduct);
}

export async function updateProduct(id: string, data: any, token?: string): Promise<Product> {
  // Validate ID parameter
  if (!id || !validateInput(id, 'string') || id.length > 100) {
    throw new Error("Security Alert: Invalid ID parameter");
  }

  // Validate input data (same as createProduct)
  if (!data.title || !validateInput(data.title, 'string') || data.title.length < 3 || data.title.length > 200) {
    throw new Error("Security Alert: Invalid title parameter");
  }

  if (!data.description || !validateInput(data.description, 'string') || data.description.length > 5000) {
    throw new Error("Security Alert: Invalid description parameter");
  }

  if (!data.price || !validateInput(parseFloat(data.price), 'number') || parseFloat(data.price) <= 0) {
    throw new Error("Security Alert: Invalid price parameter");
  }

  if (!data.address || !validateInput(data.address, 'string') || data.address.length > 500) {
    throw new Error("Security Alert: Invalid address parameter");
  }

  if (!data.location || !validateInput(data.location, 'string') || data.location.length > 200) {
    throw new Error("Security Alert: Invalid location parameter");
  }

  if (!data.type || !['PG', 'Flat', 'Room', 'Hostel'].includes(data.type)) {
    throw new Error("Security Alert: Invalid property type parameter");
  }

  // Validate images array (support both old imageUrl and new images array)
  const images = data.images || (data.imageUrl ? [data.imageUrl] : []);
  if (!images.length || !images.every((url: string) => validateInput(url, 'url'))) {
    throw new Error("Security Alert: Invalid image URL parameter");
  }

  if (!data.contactNumber || !validateInput(data.contactNumber, 'string') || data.contactNumber.length > 20) {
    throw new Error("Security Alert: Invalid contact number parameter");
  }

  // Sanitize data
  const sanitizedData = {
    title: sanitizeInput(data.title),
    description: sanitizeInput(data.description),
    description_html: sanitizeInput(data.description),
    price_range: {
      minVariantPrice: { amount: sanitizeInput(data.price), currencyCode: 'INR' },
      maxVariantPrice: { amount: sanitizeInput(data.price), currencyCode: 'INR' }
    },
    tags: [sanitizeInput(data.type), sanitizeInput(data.location), sanitizeInput(data.address)].filter(Boolean),
    images: images.map((url: string) => ({ url: sanitizeInput(url), altText: sanitizeInput(data.title) })),
    featured_image: { url: sanitizeInput(images[0]), altText: sanitizeInput(data.title) },
    contact_number: sanitizeInput(data.contactNumber)
  };

  const sanitizedId = sanitizeInput(id);

  // Update in Supabase
  const { data: updatedProduct, error } = await supabase
    .from('properties')
    .update(sanitizedData)
    .eq('id', sanitizedId)
    .select()
    .single();

  if (error) {
    console.error('Error updating property:', error);
    throw new Error('Failed to update property: ' + error.message);
  }

  return mapPropertyToProduct(updatedProduct);
}

export async function deleteProduct(id: string, token?: string): Promise<{ success: boolean }> {
  // Validate ID parameter
  if (!id || !validateInput(id, 'string') || id.length > 100) {
    throw new Error("Security Alert: Invalid ID parameter");
  }

  const sanitizedId = sanitizeInput(id);

  // Delete from Supabase
  const { error } = await supabase
    .from('properties')
    .delete()
    .eq('id', sanitizedId);

  if (error) {
    console.error('Error deleting property:', error);
    throw new Error('Failed to delete property: ' + error.message);
  }

  return { success: true };
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
    const { count: active } = await supabase.from('properties').select('*', { count: 'exact', head: true }).eq('available_for_sale', true);
    const { count: users } = await supabase.from('users').select('*', { count: 'exact', head: true });

    return {
      total: total || 0,
      active: active || 0,
      users: users || 0
    };
  } catch {
    return { total: 0, active: 0, users: 0 };
  }
}

export async function getAdminProducts(page: number = 1, limit: number = 10, search: string = '', status: string = 'all'): Promise<{ products: Product[]; total: number; page: number; limit: number }> {
  try {
    let query = supabase.from('properties').select('*', { count: 'exact' });

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (status === 'active') {
      query = query.eq('available_for_sale', true);
    } else if (status === 'inactive') {
      query = query.eq('available_for_sale', false);
    } else if (status === 'pending') {
      query = query.contains('tags', ['pending_approval']);
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

export async function updateProductStatus(id: string, availableForSale: boolean, adminUserId: string): Promise<Product | null> {
  try {
    const { data, error } = await supabase
      .from('properties')
      .update({ available_for_sale: availableForSale })
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
    // 1. Get current tags
    const { data: product, error: fetchError } = await supabase
      .from('properties')
      .select('tags')
      .eq('id', id)
      .single();

    if (fetchError || !product) return false;

    // 2. Remove 'pending_approval' tag
    const newTags = (product.tags || []).filter((t: string) => t !== 'pending_approval');

    // 3. Update property
    const { error } = await supabase
      .from('properties')
      .update({
        available_for_sale: true,
        tags: newTags
      })
      .eq('id', id);

    return !error;
  } catch (error) {
    console.error('Error approving product:', error);
    return false;
  }
}

export async function getAdminUsers(page: number = 1, limit: number = 10): Promise<{ users: { userId: string; contactNumber: string; totalProperties: number; activeProperties: number }[]; total: number; page: number; limit: number }> {
  try {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: users, count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact' })
      .range(from, to);

    if (error) {
      console.error('Error fetching admin users:', error);
      return { users: [], total: 0, page, limit };
    }

    if (!users) return { users: [], total: 0, page, limit };

    // Fetch stats for each user
    const usersWithStats = await Promise.all(users.map(async (user) => {
      const { count: totalProperties } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      const { count: activeProperties } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('available_for_sale', true);

      return {
        userId: user.id,
        contactNumber: user.contact_number || 'N/A',
        totalProperties: totalProperties || 0,
        activeProperties: activeProperties || 0
      };
    }));

    return {
      users: usersWithStats,
      total: count || 0,
      page,
      limit
    };
  } catch (error) {
    console.error('Error in getAdminUsers:', error);
    return { users: [], total: 0, page, limit };
  }
}
