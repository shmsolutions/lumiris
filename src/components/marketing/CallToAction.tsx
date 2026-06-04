import { useTranslations } from 'next-intl';
import { buttonClasses, CtaArrow } from '@/components/ui/Button';
import { Link } from '@/libs/I18nNavigation';

export const CallToAction = () => {
  const t = useTranslations('Landing');

  return (
    <section className="relative overflow-hidden bg-surface">
      {/* Closing ember — the page warms back up before the footer. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute bottom-[-30%] left-1/2 h-[520px] w-[760px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse,var(--color-brand-100)_0%,transparent_70%)] opacity-70 blur-2xl" />
      </div>

      <div className="mx-auto max-w-4xl px-6 py-28 text-center">
        <span className="editorial-label inline-flex items-center gap-2 text-ink-500">
          <span className="font-display text-base leading-none text-brand-600">§</span>
          {t('chart_alta')}
        </span>
        <h2 className="font-display mx-auto mt-5 max-w-2xl text-4xl leading-[1.06] text-balance text-ink-900 sm:text-5xl">
          {t('cta_title')}
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-base text-ink-600">{t('cta_subtitle')}</p>

        <div className="mt-9 flex justify-center">
          <Link href="/sign-up/" className={buttonClasses('primary')}>
            {t('cta_button')}
            <CtaArrow />
          </Link>
        </div>
      </div>
    </section>
  );
};
