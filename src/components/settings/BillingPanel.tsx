'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { CheckIcon, CloseIcon, StarIcon } from '@/components/dashboard/Icons';
import { buttonClasses } from '@/components/ui/Button';
import { useRouter } from '@/libs/I18nNavigation';
import type { PaidPlanId, PlanId } from '@/utils/Plans';

type BillingPanelProps = {
  currentPlan: PlanId;
  subscriptionStatus: string | null;
  periodEndLabel: string | null;
  justPaid: boolean;
  /** Free-trial AI generations left; null when the plan has unlimited AI. */
  aiTrialRemaining?: number | null;
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
  const [pixPlan, setPixPlan] = useState<PaidPlanId | null>(null);
  const [pixCpf, setPixCpf] = useState('');
  const [pixData, setPixData] = useState<{ qrImage: string; qrPayload: string } | null>(null);
  const [pixLoading, setPixLoading] = useState(false);
  const [pixError, setPixError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const isPaid = props.currentPlan !== 'free';

  // Enquanto o QR está aberto, atualiza o plano periodicamente (o webhook do
  // Pix ativa em background).
  useEffect(() => {
    if (!(pixPlan && pixData)) {
      return;
    }
    const id = setInterval(() => {
      router.refresh();
    }, 4000);
    return () => {
      clearInterval(id);
    };
  }, [pixPlan, pixData, router]);

  // Pix caiu → plano ativou → fecha o modal.
  useEffect(() => {
    if (pixPlan && props.currentPlan === pixPlan) {
      setPixPlan(null);
    }
  }, [props.currentPlan, pixPlan]);

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

  // Vai direto pro checkout do Asaas — nome/CPF/endereço são coletados lá.
  const subscribe = async (plan: PaidPlanId) => {
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

  const openPix = (plan: PaidPlanId) => {
    setPixPlan(plan);
    setPixData(null);
    setPixError(null);
    setPixCpf('');
    setCopied(false);
  };

  const generatePix = async () => {
    if (!pixPlan) {
      return;
    }
    setPixError(null);
    setPixLoading(true);
    const response = await fetch('/api/billing/pix', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: pixPlan, taxId: pixCpf }),
    });
    setPixLoading(false);
    if (!response.ok) {
      setPixError(t('error_pix'));
      return;
    }
    const data = (await response.json()) as { qrImage?: string; qrPayload?: string };
    if (!(data.qrImage && data.qrPayload)) {
      setPixError(t('error_pix'));
      return;
    }
    setPixData({ qrImage: data.qrImage, qrPayload: data.qrPayload });
  };

  const copyPix = async () => {
    if (!pixData) {
      return;
    }
    await navigator.clipboard.writeText(pixData.qrPayload).catch(() => {
      // clipboard pode falhar em contexto inseguro — ignora.
    });
    setCopied(true);
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
            <div className="editorial-label text-ink-500">{t('current_plan')}</div>
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
            {typeof props.aiTrialRemaining === 'number' ? (
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">
                <StarIcon size={12} />
                {t('free_trial_remaining', { count: props.aiTrialRemaining })}
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
                  void subscribe(plan);
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

              {isCurrent ? null : (
                <button
                  type="button"
                  onClick={() => {
                    openPix(plan);
                  }}
                  className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-brand-300 px-4 py-2.5 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
                >
                  {t('pix_pay')}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {errorMessage ? <p className="text-sm text-danger">{errorMessage}</p> : null}

      <p className="text-xs text-ink-500">{t('pix_note')}</p>

      {pixPlan ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/50 p-4 backdrop-blur-sm"
          aria-modal="true"
          role="dialog"
        >
          <div className="w-full max-w-sm rounded-2xl border border-ink-200 bg-surface-elevated p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-ink-900">
                  {t('pix_modal_title', { plan: t(`plan_${pixPlan}_name` as 'plan_student_name') })}
                </h3>
                <p className="mt-0.5 text-sm font-medium text-brand-700">
                  {t(`plan_${pixPlan}_amount` as 'plan_student_amount')}
                  <span className="text-ink-500">{t('per_month')}</span>
                </p>
              </div>
              <button
                type="button"
                aria-label={tCommon('cancel')}
                onClick={() => {
                  setPixPlan(null);
                }}
                className="-mr-1 inline-flex size-8 shrink-0 items-center justify-center rounded-md text-ink-400 transition hover:bg-ink-100 hover:text-ink-900"
              >
                <CloseIcon size={16} />
              </button>
            </div>

            {pixData ? (
              <div className="mt-4 text-center">
                {/* QR vem do Asaas como PNG base64 (data URL em runtime). */}
                <img
                  alt="QR Code Pix"
                  className="mx-auto size-52 rounded-lg border border-ink-200 bg-white p-2"
                  src={`data:image/png;base64,${pixData.qrImage}`}
                />
                <p className="mt-3 text-xs text-ink-500">{t('pix_scan')}</p>
                <div className="mt-3 flex items-center gap-2">
                  <input
                    aria-label={t('pix_copy')}
                    className="min-w-0 flex-1 truncate rounded-md border border-ink-200 bg-surface px-2 py-1.5 text-xs text-ink-600"
                    readOnly
                    value={pixData.qrPayload}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      void copyPix();
                    }}
                    className="shrink-0 rounded-md bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-600"
                  >
                    {copied ? t('pix_copied') : t('pix_copy')}
                  </button>
                </div>
                <p className="mt-4 inline-flex items-center gap-2 text-xs text-ink-500">
                  <span className="size-3.5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-500" />
                  {t('pix_waiting')}
                </p>
              </div>
            ) : (
              <div className="mt-4">
                <label className="editorial-label block text-ink-600" htmlFor="pix-cpf">
                  {t('pix_cpf_label')}
                </label>
                <input
                  aria-label={t('pix_cpf_label')}
                  className="mt-1.5 w-full rounded-md border border-ink-200 bg-surface px-3 py-2 text-sm text-ink-900 transition placeholder:text-ink-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-200 focus:outline-none"
                  id="pix-cpf"
                  inputMode="numeric"
                  onChange={(e) => {
                    setPixCpf(e.target.value);
                    setPixError(null);
                  }}
                  placeholder={t('pix_cpf_placeholder')}
                  value={pixCpf}
                />
                {pixError ? <p className="mt-2 text-xs text-danger">{pixError}</p> : null}
                <p className="mt-3 text-xs text-ink-500">{t('pix_help')}</p>
                <button
                  type="button"
                  disabled={pixLoading}
                  onClick={() => {
                    void generatePix();
                  }}
                  className={buttonClasses('primary', 'mt-3 w-full', 'sm')}
                >
                  {pixLoading ? <Spinner /> : null}
                  {t('pix_generate')}
                </button>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};
