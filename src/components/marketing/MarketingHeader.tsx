'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Logo } from '@/components/brand/Logo';
import { CloseIcon, MenuIcon } from '@/components/dashboard/Icons';
import { Link } from '@/libs/I18nNavigation';

export const MarketingHeader = () => {
  const t = useTranslations('RootLayout');
  const [open, setOpen] = useState(false);
  const close = () => {
    setOpen(false);
  };

  return (
    <>
      <Link href="/" className="-m-1 p-1" aria-label="Lume" onClick={close}>
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
        <button
          type="button"
          onClick={() => {
            setOpen((v) => !v);
          }}
          aria-expanded={open}
          aria-controls="marketing-mobile-menu"
          aria-label={open ? t('menu_close') : t('menu_open')}
          className="inline-flex size-11 items-center justify-center rounded-md text-ink-700 transition hover:bg-ink-100 md:hidden"
        >
          {open ? <CloseIcon size={20} /> : <MenuIcon size={20} />}
        </button>
      </div>

      {open ? (
        <div
          id="marketing-mobile-menu"
          className="absolute inset-x-0 top-full border-b border-ink-200/70 bg-surface/95 backdrop-blur md:hidden"
        >
          <nav className="mx-auto flex max-w-6xl flex-col gap-0.5 px-4 py-3 text-sm text-ink-700">
            <a
              href="#how-it-works"
              onClick={close}
              className="rounded-md px-3 py-3 transition hover:bg-ink-100"
            >
              {t('how_it_works_link')}
            </a>
            <a
              href="#features"
              onClick={close}
              className="rounded-md px-3 py-3 transition hover:bg-ink-100"
            >
              {t('features_link')}
            </a>
            <a
              href="#pricing"
              onClick={close}
              className="rounded-md px-3 py-3 transition hover:bg-ink-100"
            >
              {t('pricing_link')}
            </a>
            <Link
              href="/sign-in/"
              onClick={close}
              className="rounded-md px-3 py-3 font-medium transition hover:bg-ink-100 sm:hidden"
            >
              {t('sign_in_link')}
            </Link>
          </nav>
        </div>
      ) : null}
    </>
  );
};
