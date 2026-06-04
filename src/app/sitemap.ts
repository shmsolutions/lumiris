import type { MetadataRoute } from 'next';
import { routing } from '@/libs/I18nRouting';
import { getBaseUrl, getI18nPath } from '@/utils/Helpers';

// Public, indexable routes only — auth/app pages are excluded via robots.
const routes = ['', '/privacy', '/terms', '/lgpd'] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getBaseUrl();

  return routes.map((route) => {
    const languages: Record<string, string> = {};
    for (const locale of routing.locales) {
      languages[locale] = `${baseUrl}${getI18nPath(route, locale)}`;
    }
    languages['x-default'] = `${baseUrl}${getI18nPath(route, routing.defaultLocale)}`;

    return {
      url: `${baseUrl}${route}`,
      lastModified: new Date(),
      changeFrequency: route === '' ? 'weekly' : 'monthly',
      priority: route === '' ? 1 : 0.5,
      alternates: { languages },
    };
  });
}
