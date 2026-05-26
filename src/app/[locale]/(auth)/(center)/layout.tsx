import { setRequestLocale } from 'next-intl/server';
import { Logo } from '@/components/brand/Logo';
import { Link } from '@/libs/I18nNavigation';

export default async function CenteredLayout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  setRequestLocale(locale);

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <header className="mx-auto w-full max-w-6xl px-6 py-6">
        <Link href="/" className="-m-1 inline-flex p-1" aria-label="Lume">
          <Logo size="md" />
        </Link>
      </header>
      <div className="flex flex-1 items-center justify-center px-6 pb-16">{props.children}</div>
    </div>
  );
}
