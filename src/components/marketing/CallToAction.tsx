import { useTranslations } from 'next-intl';
import { Link } from '@/libs/I18nNavigation';

export const CallToAction = () => {
  const t = useTranslations('Landing');

  return (
    <section className="bg-surface">
      <div className="mx-auto max-w-4xl px-6 py-24 text-center">
        <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
          {t('cta_title')}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base text-ink-600">{t('cta_subtitle')}</p>

        <div className="mt-8">
          <Link
            href="/sign-up/"
            className="inline-flex items-center justify-center rounded-md bg-brand-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600"
          >
            {t('cta_button')}
            <span aria-hidden className="ml-2">
              →
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
};
