import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { LegalPage } from '@/components/marketing/LegalPage';
import { alternatesFor } from '@/utils/Seo';

type PrivacyPageProps = { params: Promise<{ locale: string }> };

const SECTIONS = [
  'intro',
  'roles',
  'data',
  'purpose',
  'basis',
  'ai',
  'sharing',
  'retention',
  'security',
  'rights',
  'contact',
  'changes',
] as const;

export async function generateMetadata(props: PrivacyPageProps): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: 'PrivacyPage' });
  return { title: t('meta_title'), alternates: alternatesFor(locale, '/privacy') };
}

export default async function PrivacyPage(props: PrivacyPageProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'PrivacyPage' });

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
