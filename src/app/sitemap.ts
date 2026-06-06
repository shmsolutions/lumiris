import type { MetadataRoute } from 'next';
import { getAllPosts } from '@/libs/Blog';
import { routing } from '@/libs/I18nRouting';
import { getBaseUrl, getI18nPath } from '@/utils/Helpers';

// Public, indexable routes only — auth/app pages are excluded via robots.
const routes = ['', '/privacy', '/terms', '/lgpd'] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getBaseUrl();

  const staticEntries: MetadataRoute.Sitemap = routes.map((route) => {
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

  // Blog is Portuguese-only, so no hreflang alternates here.
  const blogIndex: MetadataRoute.Sitemap[number] = {
    url: `${baseUrl}/blog`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  };
  const blogPosts: MetadataRoute.Sitemap = getAllPosts().map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: 'yearly',
    priority: 0.6,
  }));

  return [...staticEntries, blogIndex, ...blogPosts];
}
