import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Anamnese } from '@/components/marketing/Anamnese';
import { CallToAction } from '@/components/marketing/CallToAction';
import { Evolucao } from '@/components/marketing/Evolucao';
import { Faq } from '@/components/marketing/Faq';
import { Hero } from '@/components/marketing/Hero';
import { Pricing } from '@/components/marketing/Pricing';
import { Relatorio } from '@/components/marketing/Relatorio';
import { JsonLd } from '@/components/seo/JsonLd';
import { alternatesFor, faqSchema, softwareAppSchema } from '@/utils/Seo';

const faqKeys = ['a', 'b', 'c', 'd', 'e', 'f'] as const;

type IndexPageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata(props: IndexPageProps): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: 'Landing' });
  return {
    title: t('meta_title'),
    description: t('meta_description'),
    alternates: alternatesFor(locale, ''),
  };
}

export default async function IndexPage(props: IndexPageProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Landing' });

  const faqItems = faqKeys.map((key) => ({
    question: t(`faq_${key}_q` as 'faq_a_q'),
    answer: t(`faq_${key}_a` as 'faq_a_a'),
  }));

  return (
    <>
      <JsonLd data={[softwareAppSchema(t('meta_description')), faqSchema(faqItems)]} />
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
