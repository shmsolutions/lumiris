import type { Metadata } from 'next';
import { routing } from '@/libs/I18nRouting';
import { getBaseUrl, getI18nPath } from '@/utils/Helpers';
import { PLAN_PRICE_CENTS } from '@/utils/Plans';

const CONTACT_EMAIL = 'oi@lumiris.com.br';

/**
 * Per-page canonical + hreflang alternates. Lists every locale plus an
 * x-default pointing at the default-locale URL — what Google wants for i18n.
 */
export const alternatesFor = (locale: string, path = ''): Metadata['alternates'] => {
  // getI18nPath returns '' for the default locale at the root — an empty href
  // breaks Next's metadata resolution, so normalize it to '/'.
  const norm = (value: string) => value || '/';
  const languages: Record<string, string> = {};
  for (const loc of routing.locales) {
    languages[loc] = norm(getI18nPath(path, loc));
  }
  languages['x-default'] = norm(getI18nPath(path, routing.defaultLocale));
  return { canonical: norm(getI18nPath(path, locale)), languages };
};

/** Organization node — identity, logo and contact for knowledge-panel signals. */
export const organizationSchema = () => {
  const baseUrl = getBaseUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Lumiris',
    url: baseUrl,
    logo: `${baseUrl}/assets/images/lumiris-logo.png`,
    email: CONTACT_EMAIL,
    description:
      'Prontuário inteligente para terapeutas ocupacionais: anamnese, evolução por áudio com IA e relatórios.',
    contactPoint: {
      '@type': 'ContactPoint',
      email: CONTACT_EMAIL,
      contactType: 'customer support',
      areaServed: 'BR',
      availableLanguage: ['Portuguese'],
    },
  };
};

/** WebSite node — ties the domain to the brand name in search. */
export const websiteSchema = () => {
  const baseUrl = getBaseUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Lumiris',
    url: baseUrl,
    inLanguage: 'pt-BR',
  };
};

/** SoftwareApplication node with the three plan offers — product rich result. */
export const softwareAppSchema = (description: string) => {
  const baseUrl = getBaseUrl();
  const offers = (['free', 'student', 'pro'] as const).map((plan) => ({
    '@type': 'Offer',
    name: plan,
    price: (PLAN_PRICE_CENTS[plan] / 100).toFixed(2),
    priceCurrency: 'BRL',
  }));
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Lumiris',
    applicationCategory: 'HealthApplication',
    operatingSystem: 'Web',
    url: baseUrl,
    description,
    inLanguage: 'pt-BR',
    offers,
  };
};

/** BlogPosting node for an article — eligible for article rich results. */
export const blogPostingSchema = (post: {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
}) => {
  const baseUrl = getBaseUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    inLanguage: 'pt-BR',
    author: { '@type': 'Person', name: post.author },
    publisher: {
      '@type': 'Organization',
      name: 'Lumiris',
      logo: { '@type': 'ImageObject', url: `${baseUrl}/assets/images/lumiris-logo.png` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${baseUrl}/blog/${post.slug}` },
  };
};

/** FAQPage node from question/answer pairs — eligible for FAQ rich results. */
export const faqSchema = (items: { question: string; answer: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: items.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: { '@type': 'Answer', text: item.answer },
  })),
});
