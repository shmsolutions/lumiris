import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { MarkdownContent } from '@/components/marketing/MarkdownContent';
import { JsonLd } from '@/components/seo/JsonLd';
import { buttonClasses, CtaArrow } from '@/components/ui/Button';
import { getAllSlugs, getPostBySlug } from '@/libs/Blog';
import { Link } from '@/libs/I18nNavigation';
import { blogPostingSchema } from '@/utils/Seo';

type BlogPostPageProps = { params: Promise<{ locale: string; slug: string }> };

// Only known posts are valid — unknown slugs 404 at the edge, keeping every
// blog page statically prerendered (no runtime filesystem access).
export const dynamicParams = false;

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata(props: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await props.params;
  const post = getPostBySlug(slug);
  if (!post) {
    return {};
  }
  return {
    title: post.title,
    description: post.description,
    // Content is Portuguese-only, so the pt-BR URL is always canonical.
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.description,
      publishedTime: post.date,
    },
  };
}

export default async function BlogPostPage(props: BlogPostPageProps) {
  const { locale, slug } = await props.params;
  setRequestLocale(locale);
  const post = getPostBySlug(slug);
  if (!post) {
    notFound();
  }
  const t = await getTranslations({ locale, namespace: 'BlogPage' });
  const dateFmt = new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });

  return (
    <article className="bg-surface">
      <JsonLd data={[blogPostingSchema(post)]} />
      <div className="mx-auto max-w-2xl px-6 py-16 sm:py-20">
        <Link className="editorial-label text-ink-500 transition hover:text-ink-800" href="/blog/">
          ← {t('back')}
        </Link>

        <time className="mt-8 block font-mono text-xs text-ink-500" dateTime={post.date}>
          {dateFmt.format(new Date(post.date))}
        </time>
        <h1 className="font-display mt-2 text-4xl leading-[1.05] text-ink-900 sm:text-5xl">
          {post.title}
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-ink-600">{post.description}</p>
        <p className="mt-3 text-sm text-ink-500">{t('by', { author: post.author })}</p>

        <div className="mt-10 border-t border-ink-200 pt-8">
          <MarkdownContent>{post.content}</MarkdownContent>
        </div>

        <aside className="mt-14 rounded-xl border border-ink-200 bg-ink-50/50 p-8 text-center">
          <h2 className="font-display text-2xl text-ink-900">{t('cta_title')}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-600">
            {t('cta_body')}
          </p>
          <div className="mt-6 flex justify-center">
            <Link className={buttonClasses('primary')} href="/sign-up/">
              {t('cta_button')}
              <CtaArrow />
            </Link>
          </div>
        </aside>
      </div>
    </article>
  );
}
