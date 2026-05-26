import { useTranslations } from 'next-intl';
import { Logo } from '@/components/brand/Logo';
import { Link } from '@/libs/I18nNavigation';

export const MarketingHeader = () => {
  const t = useTranslations('RootLayout');

  return (
    <>
      <Link href="/" className="-m-1 p-1" aria-label="Lume">
        <Logo />
      </Link>

      <nav className="hidden items-center gap-8 text-sm text-ink-600 md:flex">
        <a href="#how-it-works" className="transition hover:text-ink-900">
          {t('how_it_works_link')}
        </a>
        <a href="#features" className="transition hover:text-ink-900">
          {t('features_link')}
        </a>
        <a href="#pricing" className="transition hover:text-ink-900">
          {t('pricing_link')}
        </a>
      </nav>

      <div className="flex items-center gap-2">
        <Link
          href="/sign-in/"
          className="hidden rounded-md px-3 py-2 text-sm font-medium text-ink-700 transition hover:text-ink-900 sm:inline-flex"
        >
          {t('sign_in_link')}
        </Link>
        <Link
          href="/sign-up/"
          className="inline-flex items-center justify-center rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600"
        >
          {t('sign_up_link')}
        </Link>
      </div>
    </>
  );
};
