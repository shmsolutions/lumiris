import { SignIn } from '@clerk/nextjs';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getI18nPath } from '@/utils/Helpers';

type SignInPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(props: SignInPageProps): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({
    locale,
    namespace: 'SignIn',
  });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

export default async function SignInPage(props: SignInPageProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);

  return (
    <div className="w-full max-w-md">
      <SignIn
        path={getI18nPath('/sign-in', locale)}
        appearance={{
          variables: { colorPrimary: '#e8923c', borderRadius: '0.5rem' },
          elements: {
            rootBox: 'w-full',
            cardBox: 'w-full shadow-none',
            card: 'w-full border border-ink-200 bg-surface-elevated px-6 py-8 shadow-sm sm:px-8',
            footerActionLink: 'text-brand-700 hover:text-brand-800',
          },
        }}
      />
    </div>
  );
}
