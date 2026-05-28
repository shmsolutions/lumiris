import { redirect } from 'next/navigation';

type BillingPageProps = {
  searchParams: Promise<{ paid?: string; plan?: string }>;
};

/** Billing virou a aba "Plano" das Configurações. Mantém links/emails antigos vivos. */
export default async function BillingRedirectPage(props: BillingPageProps) {
  const { paid } = await props.searchParams;
  redirect(`/dashboard/settings/?tab=plano${paid === '1' ? '&paid=1' : ''}`);
}
