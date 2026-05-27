import { SignUp } from '@clerk/nextjs';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getI18nPath } from '@/utils/Helpers';

type SignUpPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(props: SignUpPageProps): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({
    locale,
    namespace: 'SignUp',
  });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

export default async function SignUpPage(props: SignUpPageProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);

  return (
    <SignUp
      path={getI18nPath('/sign-up', locale)}
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
