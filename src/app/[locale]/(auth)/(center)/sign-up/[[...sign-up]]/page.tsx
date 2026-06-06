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
    <div className="w-full max-w-md">
      <SignUp
        path={getI18nPath('/sign-up', locale)}
        appearance={{
          variables: {
            colorPrimary: '#e8923c',
            // Texto escuro no botao laranja (WCAG AA ~6:1); o branco padrao do
            // Clerk daria so 2,4:1 sobre #e8923c.
            colorTextOnPrimaryBackground: '#0f0f0d',
            borderRadius: '0.5rem',
          },
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
