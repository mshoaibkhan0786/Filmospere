import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://filmospere.com';

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/api/', '/search?q=', '/admin/', '/*?search='],
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    }
}
