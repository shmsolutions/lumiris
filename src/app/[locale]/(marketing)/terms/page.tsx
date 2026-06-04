import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { LegalPage } from '@/components/marketing/LegalPage';
import { alternatesFor } from '@/utils/Seo';

type TermsPageProps = { params: Promise<{ locale: string }> };

const SECTIONS = [
  'intro',
  'service',
  'eligibility',
  'responsibility',
  'ai',
  'payment',
  'ip',
  'availability',
  'liability',
  'termination',
  'law',
  'changes',
] as const;

export async function generateMetadata(props: TermsPageProps): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: 'TermsPage' });
  return { title: t('meta_title'), alternates: alternatesFor(locale, '/terms') };
}

export default async function TermsPage(props: TermsPageProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'TermsPage' });

  return (
    <LegalPage
      title={t('title')}
      updated={t('updated')}
      sections={SECTIONS.map((id) => ({
        heading: t(`s_${id}_title` as 's_intro_title'),
        body: t(`s_${id}_body` as 's_intro_body'),
      }))}
    />
  );
}
