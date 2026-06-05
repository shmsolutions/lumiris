import { setRequestLocale } from 'next-intl/server';
import { MarketingFooter } from '@/components/marketing/MarketingFooter';
import { MarketingHeader } from '@/components/marketing/MarketingHeader';
import { JsonLd } from '@/components/seo/JsonLd';
import { BaseTemplate } from '@/templates/BaseTemplate';
import { organizationSchema, websiteSchema } from '@/utils/Seo';

// The marketing pages stay fully static (no cookies()/auth on the server) so
// the landing prerenders, caches at the edge and stays bfcache-eligible. The
// header detects a likely-signed-in visitor client-side instead.
export default async function MarketingLayout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  setRequestLocale(locale);

  return (
    <>
      <JsonLd data={[organizationSchema(), websiteSchema()]} />
      <BaseTemplate header={<MarketingHeader />} footer={<MarketingFooter />}>
        {props.children}
      </BaseTemplate>
    </>
  );
}
