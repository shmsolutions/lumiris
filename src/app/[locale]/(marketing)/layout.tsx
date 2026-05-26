import { setRequestLocale } from 'next-intl/server';
import { MarketingFooter } from '@/components/marketing/MarketingFooter';
import { MarketingHeader } from '@/components/marketing/MarketingHeader';
import { BaseTemplate } from '@/templates/BaseTemplate';

export default async function MarketingLayout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  setRequestLocale(locale);

  return (
    <BaseTemplate header={<MarketingHeader />} footer={<MarketingFooter />}>
      {props.children}
    </BaseTemplate>
  );
}
