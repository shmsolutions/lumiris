'use client';

import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { CheckIcon, StarIcon } from '@/components/dashboard/Icons';
import { useRouter } from '@/libs/I18nNavigation';
import type { PaidPlanId, PlanId } from '@/utils/Plans';

type BillingPanelProps = {
  currentPlan: PlanId;
  subscriptionStatus: string | null;
  periodEndLabel: string | null;
  justPaid: boolean;
  initialTaxId: string | null;
};

/** Conta os dígitos do CPF/CNPJ; 11 (CPF) ou 14 (CNPJ) é válido. */
const taxIdDigits = (value: string) => value.replaceAll(/\D/g, '');
const isValidTaxId = (value: string) => {
  const digits = taxIdDigits(value);
  return digits.length === 11 || digits.length === 14;
};

const paidPlans: PaidPlanId[] = ['student', 'pro'];
const recommendedPlan: PaidPlanId = 'pro';

const Spinner = () => (
  <span className="size-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
);

export const BillingPanel = (props: BillingPanelProps) => {
  const t = useTranslations('BillingPage');
  const tCommon = useTranslations('Common');
  const router = useRouter();
  const [loadingPlan, setLoadingPlan] = useState<PaidPlanId | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [canceling, setCanceling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [taxId, setTaxId] = useState(props.initialTaxId ?? '');
  const [taxIdError, setTaxIdError] = useState<string | null>(null);
  const [pendingPlan, setPendingPlan] = useState<PaidPlanId | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const isPaid = props.currentPlan !== 'free';

  const cancelPlan = async () => {
    setCanceling(true);
    setCancelError(null);
    const response = await fetch('/api/billing/cancel', { method: 'POST' });
    setCanceling(false);
    if (!response.ok) {
      setCancelError(t('cancel_error'));
      return;
    }
    router.refresh();
  };

  const checkout = async (plan: PaidPlanId, digits: string) => {
    setErrorMessage(null);
    setLoadingPlan(plan);
    const response = await fetch('/api/billing/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan, taxId: digits }),
    });
    if (!response.ok) {
      setLoadingPlan(null);
      setErrorMessage(t('error_checkout'));
      return;
    }
    const { checkoutUrl } = (await response.json()) as { checkoutUrl?: string };
    if (!checkoutUrl) {
      setLoadingPlan(null);
      setErrorMessage(t('error_checkout'));
      return;
    }
    // Abre em nova aba pra o usuário não perder o contexto do app.
    window.open(checkoutUrl, '_blank', 'noopener,noreferrer');
    setLoadingPlan(null);
  };

  // Clicar em assinar: se já temos um CPF válido salvo, vai direto; senão pede.
  const onSubscribe = (plan: PaidPlanId) => {
    if (isValidTaxId(taxId)) {
      void checkout(plan, taxIdDigits(taxId));
      return;
    }
    setPendingPlan(plan);
    setTaxIdError(null);
    dialogRef.current?.showModal();
  };

  const confirmTaxId = () => {
    if (!isValidTaxId(taxId)) {
      setTaxIdError(t('error_tax_id'));
      return;
    }
    dialogRef.current?.close();
    if (pendingPlan) {
      void checkout(pendingPlan, taxIdDigits(taxId));
    }
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
          {isPaid ? (
            <ConfirmDialog
              title={t('cancel_confirm')}
              confirmLabel={t('cancel_button')}
              cancelLabel={tCommon('cancel')}
              onConfirm={cancelPlan}
              triggerLabel={t('cancel_button')}
              busyLabel={t('cancel_busy')}
              busy={canceling}
              disabled={canceling}
              triggerClassName="text-xs font-medium text-danger transition hover:underline disabled:opacity-50"
            />
          ) : null}
        </div>
        {cancelError ? <p className="mt-3 text-xs text-danger">{cancelError}</p> : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {paidPlans.map((plan) => {
          const isCurrent = props.currentPlan === plan;
          const isRecommended = plan === recommendedPlan;
          const features = t.raw(`plan_${plan}_features`) as string[];
          return (
            <div
              key={plan}
              className={`relative flex flex-col rounded-2xl border p-6 transition ${
                isRecommended
                  ? 'border-brand-300 bg-gradient-to-b from-brand-50/70 to-surface-elevated shadow-sm'
                  : 'border-ink-200 bg-surface-elevated'
              } ${isCurrent ? 'ring-2 ring-brand-300' : ''}`}
            >
              {isRecommended ? (
                <span className="absolute -top-2.5 right-5 inline-flex items-center gap-1 rounded-full bg-brand-500 px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-white uppercase shadow-sm">
                  <StarIcon size={11} />
                  {t('recommended')}
                </span>
              ) : null}

              <span className="text-base font-semibold text-ink-900">
                {t(`plan_${plan}_name` as 'plan_student_name')}
              </span>

              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-bold tracking-tight text-ink-900">
                  {t(`plan_${plan}_amount` as 'plan_student_amount')}
                </span>
                <span className="text-sm font-medium text-ink-500">{t('per_month')}</span>
              </div>

              <p className="mt-2 text-sm text-ink-600">
                {t(`plan_${plan}_desc` as 'plan_student_desc')}
              </p>

              <ul className="mt-5 space-y-2.5">
                {features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm text-ink-700">
                    <span className="mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                      <CheckIcon size={11} />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => {
                  onSubscribe(plan);
                }}
                disabled={isCurrent || loadingPlan !== null}
                className={`mt-6 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold shadow-sm transition disabled:cursor-not-allowed ${
                  isCurrent
                    ? 'bg-ink-100 text-ink-500'
                    : 'bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-60'
                }`}
              >
                {loadingPlan === plan ? <Spinner /> : null}
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

      <dialog
        ref={dialogRef}
        className="m-auto w-[calc(100vw-2rem)] max-w-sm rounded-xl border border-ink-200 bg-surface-elevated p-6 text-ink-800 shadow-xl backdrop:bg-ink-900/40"
      >
        <p className="text-sm font-semibold text-ink-900">{t('tax_id_dialog_title')}</p>
        <p className="mt-1 text-xs text-ink-500">{t('hint_tax_id')}</p>
        <input
          inputMode="numeric"
          aria-label={t('label_tax_id')}
          className="mt-4 w-full rounded-md border border-ink-200 bg-surface px-3 py-2 text-sm text-ink-900 transition placeholder:text-ink-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-200 focus:outline-none"
          placeholder={t('placeholder_tax_id')}
          value={taxId}
          onChange={(e) => {
            setTaxId(e.target.value);
            setTaxIdError(null);
          }}
        />
        {taxIdError ? <p className="mt-2 text-xs text-danger">{taxIdError}</p> : null}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              dialogRef.current?.close();
            }}
            className="inline-flex min-h-11 items-center rounded-md border border-ink-200 px-4 py-2 text-sm font-medium text-ink-700 transition hover:bg-ink-100"
          >
            {tCommon('cancel')}
          </button>
          <button
            type="button"
            onClick={confirmTaxId}
            className="inline-flex min-h-11 items-center rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600"
          >
            {t('tax_id_dialog_confirm')}
          </button>
        </div>
      </dialog>
    </div>
  );
};
