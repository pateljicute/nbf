import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import {
    mapPropertyToProduct,
    validateInput,
    sanitizeInput,
    checkRateLimit,
    verifyAuth,
    validateCSRFToken
} from '@/lib/backend-utils';

export async function POST(request: NextRequest) {
    try {
        checkRateLimit(request.headers, 'create');

        const user = await verifyAuth(request.headers);
        console.log('POST /products/create user:', user.id);

        // CSRF Token validation
        const csrfToken = request.headers.get('x-csrf-token') || request.headers.get('X-CSRF-Token');
        if (!csrfToken || !validateCSRFToken(csrfToken, user.id)) {
            throw new Error("Security Alert: Invalid or missing CSRF token");
        }

        const body = await request.json();
        console.log('POST /products/create body:', body);

        // Validate and sanitize inputs
        const { title, description, price, address, location, type, images, contactNumber } = body;

        // Input validation
        if (!title || !validateInput(title, 'string') || title.length < 3 || title.length > 200) {
            throw new Error("Security Alert: Invalid title parameter");
        }

        if (!description || !validateInput(description, 'string') || description.length > 5000) {
            throw new Error("Security Alert: Invalid description parameter");
        }

        if (!price || !validateInput(parseFloat(price), 'number') || parseFloat(price) <= 0) {
            throw new Error("Security Alert: Invalid price parameter");
        }

        if (!address || !validateInput(address, 'string') || address.length > 500) {
            throw new Error("Security Alert: Invalid address parameter");
        }

        if (!location || !validateInput(location, 'string') || location.length > 200) {
            throw new Error("Security Alert: Invalid location parameter");
        }

        if (!type || !['PG', 'Flat', 'Room', 'Hostel'].includes(type)) {
            throw new Error("Security Alert: Invalid property type parameter");
        }

        if (!images || !Array.isArray(images) || images.length === 0 || !images.every((url: string) => validateInput(url, 'url'))) {
            throw new Error("Security Alert: Invalid images parameter");
        }

        if (!contactNumber || !validateInput(contactNumber, 'string') || contactNumber.length > 20) {
            throw new Error("Security Alert: Invalid contact number parameter");
        }

        // Sanitize inputs
        const cleanTitle = sanitizeInput(title);
        const cleanDescription = sanitizeInput(description);
        const cleanAddress = sanitizeInput(address);
        const cleanLocation = sanitizeInput(location);
        const cleanType = sanitizeInput(type);
        const cleanImages = images.map((url: string) => sanitizeInput(url));
        const cleanContactNumber = sanitizeInput(contactNumber);

        const handle = cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const id = `prop_${Date.now()}`;

        const newProperty = {
            id,
            handle,
            title: cleanTitle,
            description: cleanDescription,
            category_id: cleanAddress,
            currency_code: "INR",
            seo: { title: cleanTitle, description: cleanDescription },
            featured_image: {
                url: cleanImages[0],
                altText: cleanTitle,
                width: 800,
                height: 600,
            },
            images: cleanImages.map((url: string) => ({
                url,
                altText: cleanTitle,
                width: 800,
                height: 600,
            })),
            options: [],
            variants: [
                {
                    id: `var_${Date.now()}`,
                    title: "Default Title",
                    price: { amount: price, currencyCode: "INR" },
                    availableForSale: true,
                    selectedOptions: [],
                }
            ],
            tags: [cleanType, cleanLocation, "New Listing"],
            available_for_sale: true,
            price_range: {
                minVariantPrice: { amount: price, currencyCode: "INR" },
                maxVariantPrice: { amount: price, currencyCode: "INR" },
            },
            user_id: user.id,
            contact_number: cleanContactNumber
        };

        const { data, error } = await supabase
            .from("properties")
            .insert([newProperty])
            .select()
            .single();

        if (error) {
            console.error("Error creating property:", error);
            throw error;
        }

        return NextResponse.json(mapPropertyToProduct(data));
    } catch (error: any) {
        console.error('Error in POST /products/create:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
