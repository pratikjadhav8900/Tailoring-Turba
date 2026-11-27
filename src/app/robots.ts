import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://tailoringturba.com';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // /ops/ and /crm/ are reachable directly on the main domain too (see src/middleware.ts) — internal staff
      // tools, never meant to be indexed. /cart/ and /checkout/ are transient, user-specific pages.
      disallow: ['/admin/', '/api/', '/dashboard/', '/ops/', '/crm/', '/cart/', '/checkout/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
