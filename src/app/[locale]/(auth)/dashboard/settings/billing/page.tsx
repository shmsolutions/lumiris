import { auth } from '@clerk/nextjs/server';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { TopBar } from '@/components/dashboard/TopBar';
import { BillingPanel } from '@/components/settings/BillingPanel';
import { Link } from '@/libs/I18nNavigation';
import { getUserProfile } from '@/libs/UserProfile';

type BillingPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ paid?: string }>;
};

export async function generateMetadata(props: BillingPageProps): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: 'BillingPage' });
  return { title: t('meta_title') };
}

export default async function BillingPage(props: BillingPageProps) {
  const { locale } = await props.params;
  const { paid } = await props.searchParams;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'BillingPage' });
  const tSettings = await getTranslations({ locale, namespace: 'SettingsPage' });

  const { userId } = await auth();
  const profile = userId
    ? await getUserProfile(userId)
    : {
        plan: 'free' as const,
        subscriptionStatus: null,
        currentPeriodEnd: null,
      };

  const periodEndLabel = profile.currentPeriodEnd
    ? new Intl.DateTimeFormat(locale, {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }).format(profile.currentPeriodEnd)
    : null;

  return (
    <>
      <TopBar
        breadcrumb={
          <Link href="/dashboard/settings/" className="transition hover:text-ink-900">
            {tSettings('title')}
          </Link>
        }
        title={t('title')}
      />
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <PageHeader
          eyebrow={tSettings('title')}
          title={t('title')}
          description={t('description')}
        />
        <div className="mt-8">
          <BillingPanel
            currentPlan={profile.plan}
            subscriptionStatus={profile.subscriptionStatus}
            periodEndLabel={periodEndLabel}
            justPaid={paid === '1'}
          />
        </div>
      </div>
    </>
  );
}
