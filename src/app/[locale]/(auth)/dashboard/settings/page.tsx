import { UserProfile } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { TopBar } from '@/components/dashboard/TopBar';
import { BillingPanel } from '@/components/settings/BillingPanel';
import { SettingsTabs } from '@/components/settings/SettingsTabs';
import type { SettingsTabId } from '@/components/settings/SettingsTabs';
import { SignatureUploader } from '@/components/settings/SignatureUploader';
import { TherapistProfileForm } from '@/components/settings/TherapistProfileForm';
import { listPaymentsForUser } from '@/libs/Payments';
import { getUserProfile, getUserSignature } from '@/libs/UserProfile';
import { FREE_AI_TRIAL, PLAN_LIMITS } from '@/utils/Plans';

const STATUS_BADGE: Record<string, string> = {
  paid: 'bg-success/15 text-success',
  pending: 'bg-warning/15 text-warning',
  canceled: 'bg-ink-100 text-ink-500',
  expired: 'bg-ink-100 text-ink-500',
};

type SettingsPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tab?: string; plan?: string; paid?: string }>;
};

export async function generateMetadata(props: SettingsPageProps): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: 'SettingsPage' });
  return { title: t('meta_title') };
}

const resolveTab = (params: { tab?: string; plan?: string; paid?: string }): SettingsTabId => {
  if (params.tab === 'perfil' || params.tab === 'plano' || params.tab === 'conta') {
    return params.tab;
  }
  if (params.paid === '1' || params.plan) {
    return 'plano';
  }
  return 'perfil';
};

export default async function SettingsPage(props: SettingsPageProps) {
  const { locale } = await props.params;
  const search = await props.searchParams;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'SettingsPage' });
  const tNav = await getTranslations({ locale, namespace: 'DashboardNav' });
  const tBilling = await getTranslations({ locale, namespace: 'BillingPage' });

  const { userId } = await auth();
  const profile = userId
    ? await getUserProfile(userId)
    : {
        plan: 'free' as const,
        subscriptionStatus: null,
        currentPeriodEnd: null,
        taxId: null,
        therapistName: '',
        crefito: '',
        studentName: '',
        aiTrialUsed: 0,
      };

  const aiTrialRemaining = PLAN_LIMITS[profile.plan].ai
    ? null
    : Math.max(0, FREE_AI_TRIAL - profile.aiTrialUsed);

  const periodEndLabel = profile.currentPeriodEnd
    ? new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'long', year: 'numeric' }).format(
        profile.currentPeriodEnd,
      )
    : null;

  const payments = userId ? await listPaymentsForUser(userId) : [];
  const signature = userId ? await getUserSignature(userId) : null;
  const canUseSignature = PLAN_LIMITS[profile.plan].signature;
  const currency = new Intl.NumberFormat(locale, { style: 'currency', currency: 'BRL' });
  const shortDate = new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const sectionIntro = (title: string, description: string) => (
    <div className="mb-6">
      <h2 className="text-base font-semibold text-ink-900">{title}</h2>
      <p className="mt-1 text-sm text-ink-500">{description}</p>
    </div>
  );

  const perfil = (
    <section>
      {sectionIntro(t('therapist_title'), t('therapist_description'))}
      <TherapistProfileForm
        initialValues={{
          therapistName: profile.therapistName ?? '',
          crefito: profile.crefito ?? '',
          studentName: profile.studentName ?? '',
        }}
      />
      <div className="mt-6">
        <SignatureUploader
          allowed={canUseSignature}
          initialSignatureUrl={signature?.dataUrl ?? null}
        />
      </div>
    </section>
  );

  const plano = (
    <section>
      {sectionIntro(t('billing_title'), t('billing_description'))}
      <BillingPanel
        currentPlan={profile.plan}
        subscriptionStatus={profile.subscriptionStatus}
        periodEndLabel={periodEndLabel}
        justPaid={search.paid === '1'}
        aiTrialRemaining={aiTrialRemaining}
      />
      {payments.length > 0 ? (
        <div className="mt-10 rounded-xl border border-ink-200 bg-surface-elevated p-6">
          <h3 className="text-sm font-semibold text-ink-900">{tBilling('history_title')}</h3>
          <p className="mt-1 text-xs text-ink-500">{tBilling('history_description')}</p>
          <ul className="mt-5 divide-y divide-ink-200">
            {payments.map((p) => {
              const dateLabel = shortDate.format(p.paidAt ?? p.createdAt);
              const planLabel = tBilling(`plan_${p.plan}_name` as 'plan_student_name');
              const statusLabel = tBilling(`status_${p.status}` as 'status_paid');
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
                        {tBilling('history_pay_now')}
                      </a>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </section>
  );

  const conta = (
    <section>
      {sectionIntro(t('account_title'), t('account_description'))}
      <UserProfile
        routing="hash"
        appearance={{
          elements: {
            rootBox: 'w-full',
            cardBox: 'w-full max-w-none shadow-none border border-ink-200 rounded-xl',
          },
        }}
      />
    </section>
  );

  return (
    <>
      <TopBar breadcrumb={tNav('section_account')} />
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        <PageHeader title={t('title')} description={t('description')} />
        <div className="mt-8">
          <SettingsTabs
            initialTab={resolveTab(search)}
            labels={{ perfil: t('tab_profile'), plano: t('tab_plan'), conta: t('tab_account') }}
            perfil={perfil}
            plano={plano}
            conta={conta}
          />
        </div>
      </div>
    </>
  );
}
