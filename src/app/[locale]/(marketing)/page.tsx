import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Anamnese } from '@/components/marketing/Anamnese';
import { CallToAction } from '@/components/marketing/CallToAction';
import { Evolucao } from '@/components/marketing/Evolucao';
import { Faq } from '@/components/marketing/Faq';
import { Hero } from '@/components/marketing/Hero';
import { Pricing } from '@/components/marketing/Pricing';
import { Relatorio } from '@/components/marketing/Relatorio';

type IndexPageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata(props: IndexPageProps): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: 'Landing' });
  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

export default async function IndexPage(props: IndexPageProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);

  return (
    <>
      <Hero />
      <Anamnese />
      <Evolucao />
      <Relatorio />
      <Pricing />
      <Faq />
      <CallToAction />
    </>
  );
}
