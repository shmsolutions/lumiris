import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Logo } from '@/components/brand/Logo';
import { Link } from '@/libs/I18nNavigation';

const Bullet = (props: { children: React.ReactNode }) => (
  <li className="flex items-start gap-3">
    <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-white/15">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M5 13l4 4L19 7"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
    <span className="text-sm text-white/90">{props.children}</span>
  </li>
);

export default async function CenteredLayout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'AuthLayout' });

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-brand-800 p-12 text-white lg:flex">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-white/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -left-16 size-80 rounded-full bg-brand-500/30 blur-3xl"
        />

        <Link href="/" className="relative inline-flex w-fit" aria-label="Lumiris">
          <Logo size="lg" tone="light" />
        </Link>

        <div className="relative max-w-md space-y-6">
          <h2 className="text-3xl leading-tight font-semibold tracking-tight">{t('headline')}</h2>
          <p className="text-white/80">{t('subtitle')}</p>
          <ul className="space-y-3">
            <Bullet>{t('bullet_audio')}</Bullet>
            <Bullet>{t('bullet_crefito')}</Bullet>
            <Bullet>{t('bullet_reports')}</Bullet>
          </ul>
        </div>

        <p className="relative text-sm text-white/60">{t('footer')}</p>
      </aside>

      <main className="flex flex-col bg-surface">
        <header className="flex items-center justify-between px-6 py-6 lg:px-10">
          <Link href="/" className="-m-1 inline-flex p-1 lg:hidden" aria-label="Lumiris">
            <Logo size="sm" />
          </Link>
          <Link href="/" className="ml-auto text-sm text-ink-500 transition hover:text-ink-700">
            ← {t('back_home')}
          </Link>
        </header>
        <div className="flex flex-1 items-center justify-center px-6 pb-16">{props.children}</div>
      </main>
    </div>
  );
}
