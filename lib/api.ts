import { Product, Collection, Cart, ProductSortKey, ProductCollectionSortKey } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// CSRF Token utilities
let csrfToken: string | null = null;
let csrfTokenExpiry: number | null = null;

const getCSRFToken = async (token?: string): Promise<string> => {
  // If we have a valid token, return it
  if (csrfToken && csrfTokenExpiry && Date.now() < csrfTokenExpiry) {
    return csrfToken;
  }

  // Otherwise fetch a new one from the backend
  const headers: any = {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    'X-Client-Type': 'web-app'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/csrf-token`, {
    method: 'GET',
    headers
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || 'Failed to get CSRF token');
  }

  const data = await response.json();
  csrfToken = data.csrfToken;
  // Set expiry to 23 hours (1 hour before the 24-hour server-side expiry)
  csrfTokenExpiry = Date.now() + (23 * 60 * 60 * 1000);

  return csrfToken;
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
const mockProducts: Product[] = [];;

const mockCollections: Collection[] = [];;

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
    // Validate parameters
    if (params?.query && !validateInput(params.query, 'string')) {
      throw new Error("Security Alert: Invalid query parameter");
    }

    if (params?.limit && !validateInput(params.limit, 'number')) {
      throw new Error("Security Alert: Invalid limit parameter");
    }

    if (params?.minPrice && (!validateInput(parseFloat(params.minPrice), 'number') || parseFloat(params.minPrice) < 0)) {
      throw new Error("Security Alert: Invalid minPrice parameter");
    }

    if (params?.maxPrice && (!validateInput(parseFloat(params.maxPrice), 'number') || parseFloat(params.maxPrice) < 0)) {
      throw new Error("Security Alert: Invalid maxPrice parameter");
    }

    if (params?.location && !validateInput(params.location, 'string')) {
      throw new Error("Security Alert: Invalid location parameter");
    }

    if (params?.propertyType && !['PG', 'Flat', 'Room', 'Hostel', '1BHK', '2BHK', '3BHK'].includes(params.propertyType)) {
      throw new Error("Security Alert: Invalid propertyType parameter");
    }

    if (params?.amenities && !Array.isArray(params.amenities)) {
      throw new Error("Security Alert: Invalid amenities parameter");
    }

    // Sanitize and validate inputs
    const sanitizedParams = {
      ...params,
      query: params?.query ? sanitizeInput(params.query) : undefined,
      limit: params?.limit ? Math.min(Math.max(params.limit, 1), 1000) : undefined, // Limit range
      minPrice: params?.minPrice ? sanitizeInput(params.minPrice) : undefined,
      maxPrice: params?.maxPrice ? sanitizeInput(params.maxPrice) : undefined,
      location: params?.location ? sanitizeInput(params.location) : undefined,
      propertyType: params?.propertyType ? sanitizeInput(params.propertyType) : undefined,
      amenities: params?.amenities ? params.amenities.map(sanitizeInput) : undefined
    };

    const isPost = sanitizedParams && Object.keys(sanitizedParams).length > 0;
    const response = await fetch(`${API_URL}/products`, {
      method: isPost ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Add security headers
        'X-Requested-With': 'XMLHttpRequest',
        'X-Client-Type': 'web-app'
      },
      body: isPost ? JSON.stringify(sanitizedParams) : undefined,
      next: { revalidate: 300 } // Cache for 5 minutes
    });

    if (!response.ok) {
      // Check if it's a security error
      if (response.status === 400 || response.status === 403) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Security error:', errorData);
        throw new Error(errorData.message || 'Security validation failed');
      }
      return mockProducts;
    }
    return await response.json();
  } catch (error) {
    console.error('API error:', error);
    return mockProducts;
  }
}

export async function getProduct(handle: string): Promise<Product | null> {
  // Validate handle parameter
  if (!handle || !validateInput(handle, 'string') || handle.length > 200) {
    console.error("Security Alert: Invalid handle parameter");
    return null;
  }

  try {
    const sanitizedHandle = sanitizeInput(handle);
    const response = await fetch(`${API_URL}/products/${sanitizedHandle}`, {
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'X-Client-Type': 'web-app'
      },
      next: { revalidate: 300 }
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

export async function getUserProducts(userId: string): Promise<Product[]> {
  try {
    const response = await fetch(`${API_URL}/products/user/${userId}`, {
      cache: 'no-store' // User data should be fresh
    });
    if (!response.ok) return [];
    return await response.json();
  } catch {
    return [];
  }
}

export async function getCollections(): Promise<Collection[]> {
  try {
    const response = await fetch(`${API_URL}/collections`, {
      next: { revalidate: 3600 } // Cache for 1 hour
    });
    if (!response.ok) return mockCollections;
    return await response.json();
  } catch {
    return mockCollections;
  }
}

export async function getCollection(handle: string): Promise<Collection | null> {
  try {
    const response = await fetch(`${API_URL}/collections/${handle}`, {
      next: { revalidate: 3600 }
    });
    if (!response.ok) return null;
    return await response.json();
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
  try {
    const response = await fetch(`${API_URL}/collections/${params.collection}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
      next: { revalidate: 300 }
    });
    if (!response.ok) return mockProducts;
    return await response.json();
  } catch {
    return mockProducts;
  }
}

export async function getCart(cartId: string): Promise<Cart | null> {
  try {
    const response = await fetch(`${API_URL}/cart/${cartId}`);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

export async function createCart(): Promise<Cart> {
  const response = await fetch(`${API_URL}/cart`, { method: 'POST' });
  return await response.json();
}

export async function addToCart(cartId: string, lines: Array<{ merchandiseId: string; quantity: number }>): Promise<Cart> {
  const response = await fetch(`${API_URL}/cart/${cartId}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lines }),
  });
  return await response.json();
}

export async function updateCart(cartId: string, lines: Array<{ id: string; merchandiseId: string; quantity: number }>): Promise<Cart> {
  const response = await fetch(`${API_URL}/cart/${cartId}/items`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lines }),
  });
  return await response.json();
}

export async function removeFromCart(cartId: string, lineIds: string[]): Promise<Cart> {
  const response = await fetch(`${API_URL}/cart/${cartId}/items`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lineIds }),
  });
  return await response.json();
}

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
    ...data,
    title: sanitizeInput(data.title),
    description: sanitizeInput(data.description),
    address: sanitizeInput(data.address),
    location: sanitizeInput(data.location),
    type: sanitizeInput(data.type),
    images: images.map((url: string) => sanitizeInput(url)),
    contactNumber: sanitizeInput(data.contactNumber)
  };
  delete sanitizedData.imageUrl;

  // Get CSRF token
  const csrf = await getCSRFToken(token);

  const headers: any = {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    'X-Client-Type': 'web-app',
    'X-CSRF-Token': csrf
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/products/create`, {
    method: 'POST',
    headers,
    body: JSON.stringify(sanitizedData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (response.status === 400 || response.status === 403) {
      console.error('Security validation failed:', errorData);
      throw new Error(errorData.message || errorData.error || 'Security validation failed');
    }
    throw new Error(errorData.message || errorData.error || 'Failed to create property');
  }

  return await response.json();
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
    ...data,
    title: sanitizeInput(data.title),
    description: sanitizeInput(data.description),
    address: sanitizeInput(data.address),
    location: sanitizeInput(data.location),
    type: sanitizeInput(data.type),
    images: images.map((url: string) => sanitizeInput(url)),
    contactNumber: sanitizeInput(data.contactNumber)
  };
  delete sanitizedData.imageUrl;

  // Get CSRF token
  const csrf = await getCSRFToken(token);

  const headers: any = {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    'X-Client-Type': 'web-app',
    'X-CSRF-Token': csrf
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const sanitizedId = sanitizeInput(id);
  const response = await fetch(`${API_URL}/products/${sanitizedId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(sanitizedData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (response.status === 400 || response.status === 403) {
      console.error('Security validation failed:', errorData);
      throw new Error(errorData.message || errorData.error || 'Security validation failed');
    }
    throw new Error(errorData.message || errorData.error || 'Failed to update property');
  }

  return await response.json();
}

export async function deleteProduct(id: string, token?: string): Promise<{ success: boolean }> {
  // Validate ID parameter
  if (!id || !validateInput(id, 'string') || id.length > 100) {
    throw new Error("Security Alert: Invalid ID parameter");
  }

  // Get CSRF token
  const csrf = await getCSRFToken(token);

  const headers: any = {
    'X-Requested-With': 'XMLHttpRequest',
    'X-Client-Type': 'web-app',
    'X-CSRF-Token': csrf
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const sanitizedId = sanitizeInput(id);
  const response = await fetch(`${API_URL}/products/${sanitizedId}`, {
    method: 'DELETE',
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (response.status === 400 || response.status === 403) {
      console.error('Security validation failed:', errorData);
      throw new Error(errorData.message || errorData.error || 'Security validation failed');
    }
    throw new Error(errorData.message || errorData.error || 'Failed to delete property');
  }

  return await response.json();
}

export async function checkIsAdmin(userId: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/admin/check/${userId}`);
    const data = await response.json();
    return data.isAdmin || false;
  } catch {
    return false;
  }
}

export async function adminDeleteProduct(id: string, adminUserId: string): Promise<{ success: boolean }> {
  const response = await fetch(`${API_URL}/admin/products/${id}`, {
    method: 'DELETE',
    headers: {
      'x-admin-user-id': adminUserId,
    },
  });
  return await response.json();
}

export async function getAdminStats(): Promise<{ total: number; active: number; users: number }> {
  try {
    const response = await fetch(`${API_URL}/admin/stats`);
    if (!response.ok) return { total: 0, active: 0, users: 0 };
    return await response.json();
  } catch {
    return { total: 0, active: 0, users: 0 };
  }
}

export async function getAdminProducts(page: number = 1, limit: number = 10, search: string = '', status: string = 'all'): Promise<{ products: Product[]; total: number; page: number; limit: number }> {
  try {
    const response = await fetch(`${API_URL}/admin/products?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&status=${status}`);
    if (!response.ok) return { products: [], total: 0, page, limit };
    return await response.json();
  } catch {
    return { products: [], total: 0, page, limit };
  }
}

export async function updateProductStatus(id: string, availableForSale: boolean, adminUserId: string): Promise<Product | null> {
  try {
    const response = await fetch(`${API_URL}/admin/products/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-user-id': adminUserId,
      },
      body: JSON.stringify({ availableForSale }),
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

export async function getAdminUsers(page: number = 1, limit: number = 10): Promise<{ users: { userId: string; contactNumber: string; totalProperties: number; activeProperties: number }[]; total: number; page: number; limit: number }> {
  try {
    const response = await fetch(`${API_URL}/admin/users?page=${page}&limit=${limit}`);
    if (!response.ok) return { users: [], total: 0, page, limit };
    return await response.json();
  } catch {
    return { users: [], total: 0, page, limit };
  }
}
