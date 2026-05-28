import { setRequestLocale } from 'next-intl/server';
import { cookies } from 'next/headers';
import { MarketingFooter } from '@/components/marketing/MarketingFooter';
import { MarketingHeader } from '@/components/marketing/MarketingHeader';
import { BaseTemplate } from '@/templates/BaseTemplate';

// The marketing pages run without the Clerk middleware/provider (so the
// landing stays cheap and i18n-friendly). We detect a likely-signed-in
// visitor by the Clerk session cookies it leaves on the domain — if the
// guess is wrong, the dashboard's own auth catches it on the next click.
const hasClerkSession = async () => {
  const store = await cookies();
  if (store.get('__session')) {
    return true;
  }
  const uat = store.get('__client_uat')?.value;
  return Boolean(uat && uat !== '0');
};

export default async function MarketingLayout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const isSignedIn = await hasClerkSession();

  return (
    <BaseTemplate header={<MarketingHeader isSignedIn={isSignedIn} />} footer={<MarketingFooter />}>
      {props.children}
    </BaseTemplate>
  );
}
