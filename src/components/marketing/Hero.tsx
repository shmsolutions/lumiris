import { useTranslations } from 'next-intl';
import { buttonClasses, CtaArrow } from '@/components/ui/Button';
import { Link } from '@/libs/I18nNavigation';

const trustKeys = ['hero_trust_a', 'hero_trust_b', 'hero_trust_c'] as const;

export const Hero = () => {
  const t = useTranslations('Landing');

  return (
    <section className="relative overflow-hidden border-b border-ink-200/60">
      {/* Contained ember — warmth rising from the baseline, not a decorative blob. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -bottom-40 left-1/2 h-[560px] w-[820px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse,var(--color-brand-100)_0%,transparent_70%)] opacity-70 blur-2xl" />
      </div>

      {/* Vertical masthead pinned to the right edge — the spine of a bound chart. */}
      <div className="pointer-events-none absolute top-0 right-6 hidden h-full items-center lg:flex">
        <span className="editorial-label text-ink-500 [writing-mode:vertical-rl]">
          {t('chart_doc_label')} · {t('hero_eyebrow')}
        </span>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-20 sm:py-28 lg:py-36">
        <p className="editorial-label flex items-center gap-3 text-ink-500">
          <span className="font-mono text-brand-700 tabular-nums">01</span>
          <span className="h-px w-10 bg-ink-300" />
          {t('hero_masthead')}
        </p>

        <h1 className="font-display mt-8 text-[3.25rem] leading-[0.98] text-balance text-ink-900 sm:text-7xl lg:text-[6.5rem]">
          {t('hero_title_a')}{' '}
          <em className="font-normal text-brand-600 italic">{t('hero_title_highlight')}</em>{' '}
          {t('hero_title_b')}
        </h1>

        <div className="mt-10 grid gap-8 sm:grid-cols-[1fr_auto] sm:items-end">
          <p className="max-w-md text-lg leading-relaxed text-ink-600">{t('hero_subtitle')}</p>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
            <Link href="/sign-up/" className={buttonClasses('primary')}>
              {t('hero_cta_primary')}
              <CtaArrow />
            </Link>
            <a href="#anamnese" className={buttonClasses('ghost')}>
              {t('hero_cta_secondary')}
              <CtaArrow />
            </a>
          </div>
        </div>

        <p className="mt-5 text-xs text-ink-500">{t('hero_note')}</p>

        <ul className="mt-16 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-ink-200 pt-6 text-ink-500">
          {trustKeys.map((key) => (
            <li key={key} className="editorial-label flex items-center gap-2">
              <span className="size-1 rounded-full bg-brand-400" />
              {t(key)}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};
