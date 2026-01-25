import { supabase } from './db';
import { Redis } from '@upstash/redis';

// Initialize Redis client
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
    : null;

import { Product, Collection, Money, Image } from './types';

// --- Helper to Normalize Price Range ---
export const normalizePriceRange = (prop: any) => {
    if (prop.price_range && prop.price_range.minVariantPrice) {
        return prop.price_range;
    }
    // Fallback default
    return {
        minVariantPrice: { amount: prop.price ? String(prop.price) : '0', currencyCode: 'INR' },
        maxVariantPrice: { amount: prop.price ? String(prop.price) : '0', currencyCode: 'INR' }
    };
};

// --- Helper to map DB result to Product ---
export const mapPropertyToProduct = (prop: any): Product => {
    // Robust Image Handling (Handle both string[] and object[])
    const rawImages = Array.isArray(prop.images) ? prop.images : [];
    const images: Image[] = rawImages.map((img: any) => {
        if (typeof img === 'string') {
            return { url: img, altText: prop.title || 'Property Image' };
        }
        return img;
    });

    // Robust Featured Image Parsing
    let featuredImage = { url: '', altText: 'Placeholder' };
    if (prop.featured_image) {
        if (typeof prop.featured_image === 'string') {
            featuredImage = { url: prop.featured_image, altText: prop.title || 'Featured Image' };
        } else {
            featuredImage = prop.featured_image;
        }
    } else if (images.length > 0) {
        featuredImage = images[0];
    }

    return {
        id: prop.id,
        handle: prop.handle,
        title: prop.title || 'Untitled Property',
        description: prop.description || '',
        priceRange: normalizePriceRange(prop),
        currencyCode: prop.currency_code || 'INR',
        seo: prop.seo || { title: prop.title, description: prop.seo_description || prop.description },
        featuredImage: featuredImage,
        images: images,
        options: prop.options || [],
        variants: prop.variants || [],
        tags: prop.tags || [],
        availableForSale: prop.available_for_sale || false,
        userId: prop.user_id,
        contactNumber: prop.contactNumber,
        categoryId: prop.category_id,
        ownerName: prop.users?.full_name || prop.users?.name || 'Property Owner',
        amenities: prop.amenities,
        bathroom_type: prop.bathroomType || prop.bathroom_type, // Handle both cases
        securityDeposit: prop.securityDeposit,
        electricityStatus: prop.electricityStatus,
        tenantPreference: prop.tenantPreference,
        latitude: prop.latitude,
        longitude: prop.longitude,
        googleMapsLink: prop.googleMapsLink,
        leadsCount: prop.properties_leads?.[0]?.count || 0,
        is_verified: prop.is_verified,
        status: (prop.status as Product['status']) || 'pending',
        viewCount: prop.view_count || 0,
        createdAt: prop.created_at,
        price: prop.price,
        location: prop.location,
        address: prop.address,
        type: prop.type,
        state: prop.state,
        city: prop.city,
        locality: prop.locality,
        builtUpArea: prop.built_up_area,
        furnishingStatus: prop.furnishing_status,
        floorNumber: prop.floor_number,
        totalFloors: prop.total_floors,
        local_area_guide: prop.local_area_guide,
        updatedAt: prop.updated_at
    };
};

// --- Helper to map DB result to Collection ---
export const mapDbCollectionToCollection = (col: any): Collection => ({
    id: col.id,
    handle: col.handle,
    title: col.title,
    description: col.description,
    path: col.path,
    updatedAt: col.updated_at,
    seo: col.seo || { title: col.title, description: col.description }
});

// --- In-Memory Cache (Redis-like functionality) ---
// Note: In a serverless environment (like Vercel), this cache will be per-instance and cleared on cold starts.
const cache = new Map<string, { data: any, expiry: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes default TTL

export const cacheGet = (key: string) => {
    const item = cache.get(key);
    if (item && Date.now() < item.expiry) {
        return item.data;
    } else if (item) {
        cache.delete(key); // Clean up expired items
    }
    return null;
};

export const cacheSet = (key: string, data: any, ttl: number = CACHE_TTL) => {
    cache.set(key, { data, expiry: Date.now() + ttl });
};

export const cacheDelete = (key: string) => {
    cache.delete(key);
};

// --- Security: Rate Limiter ---
const rateLimit = new Map<string, { count: number, lastReset: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
// Different rate limits for different endpoints
const RATE_LIMITS = {
    general: { maxRequests: 100, window: RATE_LIMIT_WINDOW }, // General requests
    auth: { maxRequests: 10, window: RATE_LIMIT_WINDOW },     // Auth endpoints
    create: { maxRequests: 5, window: RATE_LIMIT_WINDOW },    // Property creation
    admin_write: { maxRequests: 20, window: RATE_LIMIT_WINDOW } // Admin write operations
};

export const checkRateLimit = (headers: Headers, endpointType: 'general' | 'auth' | 'create' | 'admin_write' = 'general') => {
    // Get IP from headers
    const forwardedFor = headers.get('x-forwarded-for');
    let ip = headers.get('cf-connecting-ip') ||
        (forwardedFor ? forwardedFor.split(',')[0] : '') ||
        headers.get('x-real-ip') ||
        'unknown';

    // Validate IP format to prevent bypass attempts
    if (ip === 'unknown' || !isValidIP(ip)) {
        ip = 'unknown';
    }

    const limitConfig = RATE_LIMITS[endpointType];
    const now = Date.now();
    const record = rateLimit.get(ip) || { count: 0, lastReset: now };

    if (now - record.lastReset > limitConfig.window) {
        record.count = 0;
        record.lastReset = now;
    }

    record.count++;
    rateLimit.set(ip, record);

    if (record.count > limitConfig.maxRequests) {
        console.warn(`Rate limit exceeded for IP: ${ip} on ${endpointType} endpoint`);
        throw new Error("Security Alert: Too many requests. Please try again later.");
    }
};

// Validate IP address format
const isValidIP = (ip: string): boolean => {
    // Basic IPv4 validation
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipv4Regex.test(ip)) {
        return ip.split('.').every(octet => parseInt(octet, 10) <= 255);
    }
    // Basic IPv6 validation
    const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
    if (ipv6Regex.test(ip)) {
        return true;
    }
    return false;
};

// --- Security: Input Sanitization ---
export const sanitizeInput = (input: any): any => {
    if (typeof input === 'string') {
        // Remove potential script tags and dangerous characters
        let sanitized = input
            .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gi, "")
            .replace(/<iframe\b[^>]*>([\s\S]*?)<\/iframe>/gi, "")
            .replace(/<object\b[^>]*>([\s\S]*?)<\/object>/gi, "")
            .replace(/<embed\b[^>]*>/gi, "")
            .replace(/<form\b[^>]*>([\s\S]*?)<\/form>/gi, "")
            .replace(/javascript:/gi, "")
            .replace(/vbscript:/gi, "")
            .replace(/data:/gi, "")
            .replace(/on\w+\s*=/gi, "")
            .replace(/<[^>]*>/g, (tag: string) => {
                // Allow only safe HTML tags if needed
                const safeTags = ['br', 'p', 'strong', 'em', 'ul', 'ol', 'li'];
                const tagMatch = tag.match(/<\/?([a-zA-Z]+)/);
                if (tagMatch && safeTags.includes(tagMatch[1].toLowerCase())) {
                    return tag;
                }
                return ''; // Remove dangerous HTML tags
            })
            .replace(/[<>'%_"]/g, (char: string) => {
                const chars: Record<string, string> = {
                    '<': '&lt;',
                    '>': '&gt;',
                    "'": '&#39;',
                    '"': '&quot;',
                    '%': '',  // Remove wildcards
                    '_': ''   // Remove wildcards
                };
                return chars[char] || char;
            });

        // Additional XSS prevention - limit string length
        if (sanitized.length > 1000) {
            sanitized = sanitized.substring(0, 1000);
        }

        return sanitized;
    } else if (Array.isArray(input)) {
        return input.map(sanitizeInput);
    } else if (typeof input === 'object' && input !== null) {
        const sanitizedObj: any = {};
        for (const key in input) {
            if (Object.prototype.hasOwnProperty.call(input, key)) {
                sanitizedObj[sanitizeInput(key)] = sanitizeInput(input[key]);
            }
        }
        return sanitizedObj;
    }
    return input;
};

// --- Security: Validate Input Types ---
export const validateInput = (input: any, type: 'string' | 'number' | 'email' | 'url' | 'uuid' | 'boolean' | 'array'): boolean => {
    switch (type) {
        case 'string':
            return typeof input === 'string' && input.length <= 1000;
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

// --- Security: CSRF Protection ---
const csrfTokens = new Map<string, { token: string; userId: string; createdAt: number }>();

export const generateCSRFToken = (userId: string): string => {
    const token = crypto.randomUUID();
    const tokenId = crypto.randomUUID();

    // Store the token with user ID and creation time
    csrfTokens.set(tokenId, {
        token,
        userId,
        createdAt: Date.now()
    });

    // Clean up expired tokens (older than 24 hours)
    cleanupExpiredCSRF();

    return `${tokenId}.${token}`;
};

export const validateCSRFToken = (token: string, userId: string): boolean => {
    if (!token || typeof token !== 'string') {
        return false;
    }

    const parts = token.split('.');
    if (parts.length !== 2) {
        return false;
    }

    const [tokenId, tokenValue] = parts;
    const storedToken = csrfTokens.get(tokenId);

    if (!storedToken) {
        return false;
    }

    // Verify token matches and hasn't expired (24 hours) and user matches
    const isExpired = Date.now() - storedToken.createdAt > 24 * 60 * 60 * 1000; // 24 hours

    if (isExpired) {
        csrfTokens.delete(tokenId);
        return false;
    }

    // Check if the token matches and the user ID matches
    const isValid = storedToken.token === tokenValue && storedToken.userId === userId;

    if (isValid) {
        // Remove the token after use to prevent replay attacks (for sensitive operations)
        csrfTokens.delete(tokenId);
    }

    return isValid;
};

const cleanupExpiredCSRF = () => {
    const now = Date.now();
    for (const [tokenId, storedToken] of csrfTokens.entries()) {
        if (now - storedToken.createdAt > 24 * 60 * 60 * 1000) { // 24 hours
            csrfTokens.delete(tokenId);
        }
    }
};

// --- Security: JWT Token Validation Helper ---
export const verifyAuth = async (headers: Headers) => {
    const authHeader = headers.get('authorization') || headers.get('Authorization');
    if (!authHeader) throw new Error('Unauthorized: Missing token');

    const token = authHeader.replace('Bearer ', '').trim();

    // 1. Verify Token Integrity
    if (!token || token.split('.').length !== 3) {
        throw new Error('Security Alert: Malformed token detected');
    }

    // 2. Check token expiration
    const decodedToken = parseJWT(token);
    if (!decodedToken) {
        throw new Error('Security Alert: Invalid token format');
    }

    const now = Math.floor(Date.now() / 1000);
    if (decodedToken.exp && decodedToken.exp < now) {
        throw new Error('Unauthorized: Token expired');
    }

    // 3. Verify with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
        console.error('Auth verification failed:', error);
        throw new Error('Unauthorized: Invalid token');
    }

    // 4. Additional security check - ensure user exists in our system
    const { data: existingUser, error: userCheckError } = await supabase
        .from('users')
        .select('id, status')
        .eq('id', user.id)
        .single();

    if (userCheckError) {
        console.warn('User not found in local DB, proceeding with Supabase auth:', userCheckError);
    } else if (existingUser && existingUser.status === 'suspended') {
        throw new Error('Unauthorized: Account suspended');
    }

    return user;
};

// Parse JWT token to extract payload
const parseJWT = (token: string) => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error('Error parsing JWT:', e);
        return null;
    }
};

// -- Security: Admin Authorization Helper ---
export const verifyAdmin = async (headers: Headers) => {
    const adminUserId = headers.get('x-admin-user-id') || headers.get('X-Admin-User-Id');
    if (!adminUserId) throw new Error('Unauthorized: Missing admin user ID');

    // Validate UUID format
    if (!validateInput(adminUserId, 'uuid')) {
        throw new Error('Security Alert: Invalid admin user ID format');
    }

    // Optimization: Check Redis Cache
    const cacheKey = `auth:admin:${adminUserId}`;
    if (redis) {
        try {
            const cachedAdmin = await redis.get(cacheKey);
            if (cachedAdmin) {
                return cachedAdmin;
            }
        } catch (e) {
            console.warn('Redis cache error:', e);
        }
    }

    // Check if user is an admin in the database
    const { data: adminCheck, error } = await supabase
        .from("admin_users")
        .select("user_id")
        .eq("user_id", adminUserId)
        .single();

    if (error || !adminCheck) {
        console.error('Admin verification failed:', error);
        throw new Error('Unauthorized: Admin access required');
    }

    // Cache the result
    if (redis) {
        try {
            // Cache for 5 minutes
            await redis.set(cacheKey, adminCheck, { ex: 300 });
        } catch (e) {
            console.warn('Redis set error:', e);
        }
    }

    return adminCheck;
};
