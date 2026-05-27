import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { LegalPage } from '@/components/marketing/LegalPage';

type LgpdPageProps = { params: Promise<{ locale: string }> };

const SECTIONS = [
  'intro',
  'roles',
  'sensitive',
  'rights',
  'exercise',
  'security',
  'contact',
] as const;

export async function generateMetadata(props: LgpdPageProps): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: 'LgpdPage' });
  return { title: t('meta_title') };
}

export default async function LgpdPage(props: LgpdPageProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'LgpdPage' });

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
