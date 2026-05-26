'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { CloseIcon, PlusIcon } from '@/components/dashboard/Icons';
import { useRouter } from '@/libs/I18nNavigation';
import { TreatmentPlanUpsertValidation } from '@/validations/TreatmentPlanValidation';
import type { TreatmentPlanInput } from '@/validations/TreatmentPlanValidation';

type PlanFormProps = {
  patientId: string;
  initialValues: TreatmentPlanInput;
};

const inputClass =
  'mt-1.5 w-full rounded-md border border-ink-200 bg-surface-elevated px-3 py-2 text-sm text-ink-900 transition placeholder:text-ink-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200';

const labelClass = 'block text-xs font-semibold tracking-wide text-ink-600 uppercase';

const statusOptions = ['active', 'achieved', 'paused', 'discontinued'] as const;

const statusTone: Record<(typeof statusOptions)[number], string> = {
  active: 'bg-brand-50 text-brand-700 ring-brand-200/70',
  achieved: 'bg-accent-50 text-accent-700 ring-accent-500/30',
  paused: 'bg-ink-100 text-ink-600 ring-ink-200',
  discontinued: 'bg-ink-100 text-ink-500 ring-ink-200',
};

const randomId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `obj-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;

export const PlanForm = (props: PlanFormProps) => {
  const t = useTranslations('PlanForm');
  const router = useRouter();
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const form = useForm({
    resolver: zodResolver(TreatmentPlanUpsertValidation),
    defaultValues: props.initialValues,
  });

  const objectives = useFieldArray({
    control: form.control,
    name: 'objectives',
  });

  const onSubmit = form.handleSubmit(async (data) => {
    const response = await fetch(`/api/patients/${props.patientId}/plan`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      form.setError('root', { message: t('error_save') });
      return;
    }

    setSavedAt(new Date());
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <section className="space-y-5 rounded-xl border border-ink-200 bg-surface-elevated p-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="frequency">
              {t('label_frequency')}
            </label>
            <input
              id="frequency"
              className={inputClass}
              placeholder={t('placeholder_frequency')}
              {...form.register('frequency')}
            />
          </div>
        </div>

        <div>
          <label className={labelClass} htmlFor="procedures">
            {t('label_procedures')}
          </label>
          <textarea
            id="procedures"
            rows={3}
            className={inputClass}
            placeholder={t('placeholder_procedures')}
            {...form.register('procedures')}
          />
        </div>
      </section>

      <section className="rounded-xl border border-ink-200 bg-surface-elevated p-6">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-sm font-semibold tracking-wider text-ink-500 uppercase">
              {t('objectives_title')}
            </h2>
            <p className="mt-1 text-xs text-ink-500">{t('objectives_description')}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              objectives.append({
                id: randomId(),
                title: '',
                description: '',
                status: 'active',
                estimatedSessions: 0,
                targetDate: undefined,
              });
            }}
            className="inline-flex items-center gap-1.5 rounded-md bg-brand-500 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-600"
          >
            <PlusIcon size={14} />
            {t('add_objective')}
          </button>
        </div>

        {objectives.fields.length === 0 ? (
          <div className="rounded-lg border border-dashed border-ink-300 px-5 py-8 text-center text-sm text-ink-500">
            {t('objectives_empty')}
          </div>
        ) : (
          <ul className="space-y-3">
            {objectives.fields.map((field, index) => {
              const currentStatus = form.watch(`objectives.${index}.status`) ?? 'active';
              return (
                <li key={field.id} className="rounded-lg border border-ink-200 bg-surface p-4">
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1 space-y-3">
                      <div>
                        <label className={labelClass} htmlFor={`objectives-${index}-title`}>
                          {t('objective_label_title')}
                        </label>
                        <input
                          id={`objectives-${index}-title`}
                          className={inputClass}
                          placeholder={t('objective_placeholder_title')}
                          {...form.register(`objectives.${index}.title`)}
                        />
                      </div>

                      <div>
                        <label className={labelClass} htmlFor={`objectives-${index}-description`}>
                          {t('objective_label_description')}
                        </label>
                        <textarea
                          id={`objectives-${index}-description`}
                          rows={2}
                          className={inputClass}
                          placeholder={t('objective_placeholder_description')}
                          {...form.register(`objectives.${index}.description`)}
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <span className={labelClass}>{t('objective_label_status')}</span>
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {statusOptions.map((status) => {
                              const active = currentStatus === status;
                              return (
                                <button
                                  key={status}
                                  type="button"
                                  onClick={() => {
                                    form.setValue(`objectives.${index}.status`, status);
                                  }}
                                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wider uppercase ring-1 transition ${
                                    active
                                      ? statusTone[status]
                                      : 'bg-surface-elevated text-ink-500 ring-ink-200 hover:ring-ink-300'
                                  }`}
                                >
                                  {t(`objective_status_${status}` as 'objective_status_active')}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label
                              className={labelClass}
                              htmlFor={`objectives-${index}-targetDate`}
                            >
                              {t('objective_label_target_date')}
                            </label>
                            <input
                              id={`objectives-${index}-targetDate`}
                              type="date"
                              className={inputClass}
                              {...form.register(`objectives.${index}.targetDate`)}
                            />
                          </div>
                          <div>
                            <label
                              className={labelClass}
                              htmlFor={`objectives-${index}-estimatedSessions`}
                            >
                              {t('objective_label_estimated_sessions')}
                            </label>
                            <input
                              id={`objectives-${index}-estimatedSessions`}
                              type="number"
                              min={0}
                              max={999}
                              className={inputClass}
                              {...form.register(`objectives.${index}.estimatedSessions`, {
                                valueAsNumber: true,
                              })}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        objectives.remove(index);
                      }}
                      className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-ink-400 transition hover:bg-ink-100 hover:text-danger"
                      aria-label={t('objective_remove')}
                    >
                      <CloseIcon size={16} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-ink-200 bg-surface-elevated p-6">
        <label className={labelClass} htmlFor="notes">
          {t('label_notes')}
        </label>
        <textarea
          id="notes"
          rows={3}
          className={inputClass}
          placeholder={t('placeholder_notes')}
          {...form.register('notes')}
        />
      </section>

      {form.formState.errors.root ? (
        <p className="text-sm text-danger">{form.formState.errors.root.message}</p>
      ) : null}

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="inline-flex items-center rounded-md bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 disabled:opacity-50"
        >
          {form.formState.isSubmitting ? t('button_saving') : t('button_save')}
        </button>
        {savedAt ? (
          <span className="text-xs text-success">
            {t('saved_at', { time: savedAt.toLocaleTimeString() })}
          </span>
        ) : null}
      </div>
    </form>
  );
};
