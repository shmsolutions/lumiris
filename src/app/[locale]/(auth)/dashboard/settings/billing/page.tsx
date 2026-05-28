import { auth } from '@clerk/nextjs/server';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { TopBar } from '@/components/dashboard/TopBar';
import { BillingPanel } from '@/components/settings/BillingPanel';
import { Link } from '@/libs/I18nNavigation';
import { listPaymentsForUser } from '@/libs/Payments';
import { getUserProfile } from '@/libs/UserProfile';

const STATUS_BADGE: Record<string, string> = {
  paid: 'bg-success/15 text-success',
  pending: 'bg-warning/15 text-warning',
  canceled: 'bg-ink-100 text-ink-500',
  expired: 'bg-ink-100 text-ink-500',
};

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

  const payments = userId ? await listPaymentsForUser(userId) : [];
  const currency = new Intl.NumberFormat(locale, { style: 'currency', currency: 'BRL' });
  const shortDate = new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

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

        {payments.length > 0 ? (
          <section className="mt-10 rounded-xl border border-ink-200 bg-surface-elevated p-6">
            <h2 className="text-sm font-semibold text-ink-900">{t('history_title')}</h2>
            <p className="mt-1 text-xs text-ink-500">{t('history_description')}</p>
            <ul className="mt-5 divide-y divide-ink-200">
              {payments.map((p) => {
                const dateLabel = shortDate.format(p.paidAt ?? p.createdAt);
                const planLabel = t(`plan_${p.plan}_name` as 'plan_student_name');
                const statusLabel = t(`status_${p.status}` as 'status_paid');
                const badge = STATUS_BADGE[p.status] ?? 'bg-ink-100 text-ink-500';
                return (
                  <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink-900">{planLabel}</p>
                      <p className="text-xs text-ink-500">{dateLabel}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-ink-800">
                        {currency.format(p.valueCents / 100)}
                      </span>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${badge}`}>
                        {statusLabel}
                      </span>
                      {p.status === 'pending' && p.paymentLinkUrl ? (
                        <a
                          href={p.paymentLinkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-semibold text-brand-700 transition hover:underline"
                        >
                          {t('history_pay_now')}
                        </a>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}
      </div>
    </>
  );
}
