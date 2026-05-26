'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { CheckIcon, SparkIcon } from '@/components/dashboard/Icons';
import type { PaidPlanId, PlanId } from '@/utils/Plans';

type BillingPanelProps = {
  currentPlan: PlanId;
  subscriptionStatus: string | null;
  periodEndLabel: string | null;
  justPaid: boolean;
};

const paidPlans: PaidPlanId[] = ['student', 'pro'];

export const BillingPanel = (props: BillingPanelProps) => {
  const t = useTranslations('BillingPage');
  const [loadingPlan, setLoadingPlan] = useState<PaidPlanId | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isPaid = props.currentPlan !== 'free';

  const startCheckout = async (plan: PaidPlanId) => {
    setErrorMessage(null);
    setLoadingPlan(plan);
    const response = await fetch('/api/billing/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    });
    if (!response.ok) {
      setLoadingPlan(null);
      setErrorMessage(t('error_checkout'));
      return;
    }
    const { checkoutUrl } = (await response.json()) as { checkoutUrl: string };
    window.location.href = checkoutUrl;
  };

  return (
    <div className="space-y-6">
      {props.justPaid ? (
        <div className="flex items-center gap-3 rounded-xl border border-success/30 bg-success/10 px-5 py-4">
          <span className="inline-flex size-8 items-center justify-center rounded-full bg-success/20 text-success">
            <CheckIcon size={16} />
          </span>
          <p className="text-sm font-medium text-ink-800">{t('paid_success')}</p>
        </div>
      ) : null}

      <div className="rounded-xl border border-ink-200 bg-surface-elevated p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold tracking-wider text-ink-500 uppercase">
              {t('current_plan')}
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-lg font-semibold text-ink-900">
                {t(`plan_${props.currentPlan}_name` as 'plan_free_name')}
              </span>
              {isPaid && props.subscriptionStatus === 'active' ? (
                <span className="rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-medium text-success">
                  {t('status_active')}
                </span>
              ) : null}
            </div>
            {isPaid && props.periodEndLabel ? (
              <p className="mt-1 text-xs text-ink-500">
                {t('renews_on', { date: props.periodEndLabel })}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {paidPlans.map((plan) => {
          const isCurrent = props.currentPlan === plan;
          return (
            <div
              key={plan}
              className={`flex flex-col rounded-xl border p-5 ${
                isCurrent
                  ? 'border-brand-400 bg-brand-50/40 ring-1 ring-brand-200'
                  : 'border-ink-200 bg-surface-elevated'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="inline-flex size-8 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
                  <SparkIcon size={16} />
                </span>
                <span className="text-sm font-semibold text-ink-900">
                  {t(`plan_${plan}_name` as 'plan_student_name')}
                </span>
                <span className="ml-auto text-sm font-semibold text-brand-700">
                  {t(`plan_${plan}_price` as 'plan_student_price')}
                </span>
              </div>
              <p className="mt-2 text-xs text-ink-600">
                {t(`plan_${plan}_desc` as 'plan_student_desc')}
              </p>
              <button
                type="button"
                onClick={() => {
                  void startCheckout(plan);
                }}
                disabled={isCurrent || loadingPlan !== null}
                className="mt-4 inline-flex items-center justify-center rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isCurrent
                  ? t('button_current')
                  : (loadingPlan === plan
                    ? t('button_loading')
                    : t('button_subscribe'))}
              </button>
            </div>
          );
        })}
      </div>

      {errorMessage ? <p className="text-sm text-danger">{errorMessage}</p> : null}

      <p className="text-xs text-ink-500">{t('pix_note')}</p>
    </div>
  );
};
