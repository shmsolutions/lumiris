import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { CallToAction } from '@/components/marketing/CallToAction';
import { Comparison } from '@/components/marketing/Comparison';
import { Faq } from '@/components/marketing/Faq';
import { Features } from '@/components/marketing/Features';
import { FounderNote } from '@/components/marketing/FounderNote';
import { Hero } from '@/components/marketing/Hero';
import { HowItWorks } from '@/components/marketing/HowItWorks';
import { Pricing } from '@/components/marketing/Pricing';
import { Problem } from '@/components/marketing/Problem';
import { ProductPreview } from '@/components/marketing/ProductPreview';
import { Solution } from '@/components/marketing/Solution';
import { Trust } from '@/components/marketing/Trust';

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
      <Problem />
      <Solution />
      <ProductPreview />
      <HowItWorks />
      <div id="features">
        <Features />
      </div>
      <Comparison />
      <Pricing />
      <Trust />
      <FounderNote />
      <Faq />
      <CallToAction />
    </>
  );
}
