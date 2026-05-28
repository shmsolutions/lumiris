import { useTranslations } from 'next-intl';
import { Logo } from '@/components/brand/Logo';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { Link } from '@/libs/I18nNavigation';

export const MarketingFooter = () => {
  const t = useTranslations('Footer');
  const tBase = useTranslations('BaseTemplate');

  return (
    <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
      <div>
        <Logo />
        <p className="mt-4 max-w-xs text-sm text-ink-500">{t('tagline')}</p>
      </div>

      <div>
        <h3 className="text-xs font-semibold tracking-wider text-ink-500 uppercase">
          {t('col_product')}
        </h3>
        <ul className="mt-4 space-y-2 text-sm text-ink-700">
          <li>
            <a href="#features" className="transition hover:text-ink-900">
              {t('link_features')}
            </a>
          </li>
          <li>
            <a href="#how-it-works" className="transition hover:text-ink-900">
              {t('link_how_it_works')}
            </a>
          </li>
          <li>
            <a href="#pricing" className="transition hover:text-ink-900">
              {t('link_pricing')}
            </a>
          </li>
          <li>
            <a href="#faq" className="transition hover:text-ink-900">
              {t('link_faq')}
            </a>
          </li>
        </ul>
      </div>

      <div>
        <h3 className="text-xs font-semibold tracking-wider text-ink-500 uppercase">
          {t('col_account')}
        </h3>
        <ul className="mt-4 space-y-2 text-sm text-ink-700">
          <li>
            <Link href="/sign-in/" className="transition hover:text-ink-900">
              {t('link_sign_in')}
            </Link>
          </li>
          <li>
            <Link href="/sign-up/" className="transition hover:text-ink-900">
              {t('link_sign_up')}
            </Link>
          </li>
          <li>
            <a href="mailto:oi@lumiris.com.br" className="transition hover:text-ink-900">
              {t('link_contact')}
            </a>
          </li>
        </ul>
      </div>

      <div>
        <h3 className="text-xs font-semibold tracking-wider text-ink-500 uppercase">
          {t('col_legal')}
        </h3>
        <ul className="mt-4 space-y-2 text-sm text-ink-700">
          <li>
            <Link href="/privacy/" className="transition hover:text-ink-900">
              {t('link_privacy')}
            </Link>
          </li>
          <li>
            <Link href="/terms/" className="transition hover:text-ink-900">
              {t('link_terms')}
            </Link>
          </li>
          <li>
            <Link href="/lgpd/" className="transition hover:text-ink-900">
              {t('link_lgpd')}
            </Link>
          </li>
        </ul>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-ink-200 pt-6 text-xs text-ink-500 md:col-span-4">
        <span>{tBase('footer_text', { year: new Date().getFullYear() })}</span>
        <LocaleSwitcher />
      </div>
    </div>
  );
};
