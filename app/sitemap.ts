import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.nbfhomes.in';

    // Initialize Supabase Client
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Fetch all approved properties
    const { data: properties } = await supabase
        .from('properties')
        .select('handle, updated_at')
        .eq('status', 'approved')
        .eq('available_for_sale', true);

    // Static routes
    const routes = [
        '',
        '/about',
        '/contact',
        '/search',
        '/post-property',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date().toISOString(),
        changeFrequency: 'daily' as const,
        priority: route === '' ? 1 : 0.8,
    }));

    // Dynamic routes from properties
    const propertyRoutes = (properties || []).map((property) => ({
        url: `${baseUrl}/product/${property.handle}`,
        lastModified: property.updated_at || new Date().toISOString(),
        changeFrequency: 'weekly' as const,
        priority: 0.9, // High priority for product pages
    }));

    return [...routes, ...propertyRoutes];
}
