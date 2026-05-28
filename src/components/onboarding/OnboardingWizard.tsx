'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { CheckIcon } from '@/components/dashboard/Icons';
import { useRouter } from '@/libs/I18nNavigation';
import type { PlanId } from '@/utils/Plans';

type OnboardingWizardProps = {
  firstName: string;
  initial: { therapistName: string };
};

const inputClass =
  'mt-1.5 w-full rounded-md border border-ink-200 bg-surface-elevated px-3 py-2 text-sm text-ink-900 transition placeholder:text-ink-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200';
const labelClass = 'block text-xs font-semibold tracking-wide text-ink-600 uppercase';

const planOrder: PlanId[] = ['free', 'student', 'pro'];

export const OnboardingWizard = (props: OnboardingWizardProps) => {
  const t = useTranslations('Onboarding');
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [therapistName, setTherapistName] = useState(props.initial.therapistName);
  const [plan, setPlan] = useState<PlanId>('free');
  const nameTrimmed = therapistName.trim();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const finish = async () => {
    setSubmitting(true);
    setErrorMessage(null);
    const response = await fetch('/api/me/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ therapistName: nameTrimmed, plan }),
    });
    if (!response.ok) {
      setSubmitting(false);
      setErrorMessage(t('error_generic'));
      return;
    }

    // Plano pago: leva pro billing pra coletar CPF/CNPJ e concluir a assinatura.
    if (plan !== 'free') {
      router.push('/dashboard/settings/?tab=plano');
      return;
    }

    router.push('/dashboard/');
    router.refresh();
  };

  return (
    <div className="w-full max-w-xl">
      <div className="mb-6 flex items-center gap-2">
        {[0, 1].map((s) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full transition ${
              s <= step ? 'bg-brand-500' : 'bg-ink-200'
            }`}
          />
        ))}
      </div>

      {step === 0 ? (
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
            {t('step1_title', { name: props.firstName || t('fallback_name') })}
          </h1>
          <p className="mt-2 text-sm text-ink-600">{t('step1_subtitle')}</p>

          <div className="mt-6 space-y-5 rounded-xl border border-ink-200 bg-surface-elevated p-6">
            <div>
              <label className={labelClass} htmlFor="therapistName">
                {t('label_name')}
              </label>
              <input
                id="therapistName"
                className={inputClass}
                placeholder={t('placeholder_name')}
                value={therapistName}
                onChange={(e) => {
                  setTherapistName(e.target.value);
                }}
              />
              <p className="mt-1.5 text-xs text-ink-500">{t('hint_name')}</p>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              disabled={nameTrimmed.length === 0}
              onClick={() => {
                setStep(1);
              }}
              className="inline-flex items-center rounded-md bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t('continue')}
            </button>
          </div>
        </div>
      ) : (
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">{t('step2_title')}</h1>
          <p className="mt-2 text-sm text-ink-600">{t('step2_subtitle')}</p>

          <div className="mt-6 space-y-3">
            {planOrder.map((p) => {
              const selected = plan === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    setPlan(p);
                  }}
                  className={`flex w-full items-start justify-between gap-4 rounded-xl border p-5 text-left transition ${
                    selected
                      ? 'border-brand-400 bg-brand-50/60 ring-2 ring-brand-200'
                      : 'border-ink-200 bg-surface-elevated hover:border-ink-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-ink-900">
                        {t(`plan_${p}_name` as 'plan_free_name')}
                      </span>
                      <span className="text-sm font-semibold text-brand-700">
                        {t(`plan_${p}_price` as 'plan_free_price')}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-ink-600">
                      {t(`plan_${p}_desc` as 'plan_free_desc')}
                    </p>
                  </div>
                  <span
                    className={`mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full border ${
                      selected
                        ? 'border-brand-500 bg-brand-500 text-white'
                        : 'border-ink-300 text-transparent'
                    }`}
                  >
                    <CheckIcon size={12} />
                  </span>
                </button>
              );
            })}
          </div>

          {plan !== 'free' ? (
            <p className="mt-4 rounded-lg bg-brand-50 px-4 py-3 text-xs text-brand-700">
              {t('paid_note')}
            </p>
          ) : null}

          {errorMessage ? <p className="mt-4 text-sm text-danger">{errorMessage}</p> : null}

          <div className="mt-6 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setStep(0);
              }}
              className="text-sm text-ink-500 transition hover:text-ink-700"
            >
              {t('back')}
            </button>
            <button
              type="button"
              onClick={finish}
              disabled={submitting}
              className="inline-flex items-center rounded-md bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 disabled:opacity-50"
            >
              {submitting ? t('finishing') : t('finish')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
