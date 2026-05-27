import { useTranslations } from 'next-intl';
import { HeroDemo } from '@/components/marketing/HeroDemo';
import { Link } from '@/libs/I18nNavigation';

const trustKeys = ['hero_trust_a', 'hero_trust_b', 'hero_trust_c'] as const;

export const Hero = () => {
  const t = useTranslations('Landing');

  return (
    <section className="relative overflow-hidden border-b border-ink-200/60">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="lume-glow absolute -top-32 left-1/2 h-[480px] w-[920px] -translate-x-1/2 rounded-full bg-brand-100/70 blur-3xl" />
        <div className="lume-glow absolute top-40 right-[-120px] h-72 w-72 rounded-full bg-accent-50 blur-3xl" />
      </div>

      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-24 lg:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p
              className="lume-fade-up mb-5 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium tracking-wide text-brand-700 uppercase"
              style={{ animationDelay: '0ms' }}
            >
              <span className="size-1.5 rounded-full bg-brand-500" />
              {t('hero_eyebrow')}
            </p>

            <h1
              className="lume-fade-up text-4xl leading-[1.05] font-semibold tracking-tight text-ink-900 sm:text-5xl md:text-6xl"
              style={{ animationDelay: '70ms' }}
            >
              {t('hero_title_a')}{' '}
              <span className="relative inline-block">
                <span className="relative z-10 text-brand-600">{t('hero_title_highlight')}</span>
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-1 -z-0 h-3 rounded bg-brand-200/70 sm:h-4"
                />
              </span>{' '}
              {t('hero_title_b')}
            </h1>

            <p
              className="lume-fade-up mt-6 max-w-xl text-lg text-ink-600"
              style={{ animationDelay: '140ms' }}
            >
              {t('hero_subtitle')}
            </p>

            <div
              className="lume-fade-up mt-8 flex flex-wrap items-center gap-3"
              style={{ animationDelay: '210ms' }}
            >
              <Link
                href="/sign-up/"
                className="inline-flex items-center justify-center rounded-md bg-brand-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600"
              >
                {t('hero_cta_primary')}
                <span aria-hidden="true" className="ml-2">
                  →
                </span>
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center rounded-md border border-ink-200 bg-surface-elevated px-5 py-3 text-sm font-semibold text-ink-700 transition hover:border-ink-300"
              >
                {t('hero_cta_secondary')}
              </a>
            </div>

            <p
              className="lume-fade-up mt-4 text-xs text-ink-500"
              style={{ animationDelay: '260ms' }}
            >
              {t('hero_note')}
            </p>

            <ul
              className="lume-fade-up mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-ink-500"
              style={{ animationDelay: '320ms' }}
            >
              {trustKeys.map((key) => (
                <li key={key} className="inline-flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-brand-400" />
                  {t(key)}
                </li>
              ))}
            </ul>
          </div>

          <div className="lume-fade-up" style={{ animationDelay: '180ms' }}>
            <HeroDemo />
          </div>
        </div>
      </div>
    </section>
  );
};
