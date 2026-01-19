import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.nbfhomes.in';

    return {
        rules: {
            userAgent: '*',
            allow: ['/', '/product/*', '/search'],
            disallow: ['/admin', '/api', '/profile', '/post-property/success'],
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
