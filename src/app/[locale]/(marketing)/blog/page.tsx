import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getAllPosts } from '@/libs/Blog';
import { Link } from '@/libs/I18nNavigation';
import { alternatesFor } from '@/utils/Seo';

type BlogIndexPageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata(props: BlogIndexPageProps): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: 'BlogPage' });
  return {
    title: t('meta_title'),
    description: t('meta_description'),
    alternates: alternatesFor(locale, '/blog'),
  };
}

export default async function BlogIndexPage(props: BlogIndexPageProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'BlogPage' });
  const posts = getAllPosts();
  const dateFmt = new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });

  return (
    <section className="bg-surface">
      <div className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
        <p className="editorial-label text-ink-500">{t('eyebrow')}</p>
        <h1 className="font-display mt-3 text-4xl leading-[1.05] text-ink-900 sm:text-5xl">
          {t('title')}
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-600">{t('subtitle')}</p>

        <ul className="mt-12 divide-y divide-ink-200 border-t border-ink-200">
          {posts.map((post) => (
            <li key={post.slug}>
              <Link href={`/blog/${post.slug}/`} className="group block py-7">
                <time className="font-mono text-xs text-ink-500" dateTime={post.date}>
                  {dateFmt.format(new Date(post.date))}
                </time>
                <h2 className="font-display mt-2 text-2xl text-ink-900 transition group-hover:text-brand-700">
                  {post.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-600">{post.description}</p>
                <span className="editorial-label mt-3 inline-flex items-center gap-1 text-brand-700">
                  {t('read_more')} →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
