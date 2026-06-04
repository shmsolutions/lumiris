import type { MetadataRoute } from 'next';
import { getBaseUrl } from '@/utils/Helpers';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // App and auth surfaces carry no SEO value and shouldn't be crawled.
      // Both default (unprefixed) and /en variants are covered.
      disallow: ['/dashboard', '/en/dashboard', '/onboarding', '/en/onboarding', '/api'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
