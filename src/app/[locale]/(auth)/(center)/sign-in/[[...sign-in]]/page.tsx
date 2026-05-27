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
    <SignIn
      path={getI18nPath('/sign-in', locale)}
      appearance={{
        variables: { colorPrimary: '#e8923c', borderRadius: '0.5rem' },
        elements: {
          cardBox: 'shadow-none',
          card: 'border-none bg-transparent px-0 shadow-none',
          footerActionLink: 'text-brand-700 hover:text-brand-800',
        },
      }}
    />
  );
}
