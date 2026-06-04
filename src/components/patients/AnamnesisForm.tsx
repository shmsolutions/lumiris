'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { FieldPath } from 'react-hook-form';
import type * as z from 'zod';
import { AutoGrowTextarea } from '@/components/ui/AutoGrowTextarea';
import { buttonClasses } from '@/components/ui/Button';
import { AnamnesisUpsertValidation } from '@/validations/AnamnesisValidation';
import type { AnamnesisData } from '@/validations/AnamnesisValidation';

type AnamnesisFormValues = z.infer<typeof AnamnesisUpsertValidation>;

type AnamnesisFormProps = {
  patientId: string;
  initialData: AnamnesisData;
};

const inputClass =
  'mt-1.5 w-full rounded-md border border-ink-200 bg-surface-elevated px-3 py-2 text-sm text-ink-900 transition placeholder:text-ink-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200';

const labelClass = 'editorial-label block text-ink-600';

type SectionKey = keyof AnamnesisData;
type FieldDef = { key: string; rows?: number };

const sectionFields: Record<SectionKey, FieldDef[]> = {
  identification: [
    { key: 'handedness' },
    { key: 'gestationalAge' },
    { key: 'birthType' },
    { key: 'birthWeight' },
    { key: 'referredBy' },
  ],
  clinicalHistory: [
    { key: 'mainComplaint', rows: 2 },
    { key: 'complaintOnset' },
    { key: 'medicalDiagnosis', rows: 2 },
    { key: 'previousTreatments', rows: 2 },
    { key: 'medications', rows: 2 },
    { key: 'surgeries' },
    { key: 'allergies' },
  ],
  habits: [
    { key: 'sleep' },
    { key: 'feeding' },
    { key: 'hygiene' },
    { key: 'leisure' },
    { key: 'socialInteraction' },
    { key: 'schoolPerformance', rows: 2 },
  ],
  developmentalHistory: [
    { key: 'motor', rows: 2 },
    { key: 'language', rows: 2 },
    { key: 'cognitive', rows: 2 },
    { key: 'social', rows: 2 },
  ],
  familyHistory: [
    { key: 'familyStructure', rows: 2 },
    { key: 'similarConditions' },
    { key: 'observations', rows: 2 },
  ],
  initialAssessment: [
    { key: 'generalImpression', rows: 2 },
    { key: 'posture' },
    { key: 'coordination' },
    { key: 'sensoryProcessing', rows: 2 },
    { key: 'activitiesOfDailyLiving', rows: 2 },
    { key: 'observations', rows: 2 },
  ],
  clinicalExam: [
    { key: 'physical', rows: 2 },
    { key: 'educational', rows: 2 },
    { key: 'social', rows: 2 },
  ],
  complementaryExams: [{ key: 'results', rows: 3 }],
  otDiagnosis: [{ key: 'text', rows: 3 }],
  otPrognosis: [{ key: 'text', rows: 3 }],
};

const sectionOrder: SectionKey[] = [
  'identification',
  'clinicalHistory',
  'habits',
  'developmentalHistory',
  'familyHistory',
  'initialAssessment',
  'clinicalExam',
  'complementaryExams',
  'otDiagnosis',
  'otPrognosis',
];

export const AnamnesisForm = (props: AnamnesisFormProps) => {
  const t = useTranslations('AnamnesisForm');
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const form = useForm({
    resolver: zodResolver(AnamnesisUpsertValidation),
    defaultValues: { data: props.initialData },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    const response = await fetch(`/api/patients/${props.patientId}/anamnesis`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      form.setError('root', { message: t('error_generic') });
      return;
    }

    setSavedAt(new Date());
  });

  return (
    <form onSubmit={onSubmit} className="max-w-3xl space-y-6">
      {sectionOrder.map((section) => (
        <section key={section} className="rounded-xl border border-ink-200 bg-surface-elevated p-6">
          <h2 className="mb-5 text-lg font-semibold tracking-tight text-ink-900">
            {t(`section_${section}` as 'section_identification')}
          </h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {sectionFields[section].map((field) => {
              const fieldName = `data.${section}.${field.key}` as FieldPath<AnamnesisFormValues>;
              return (
                <div key={fieldName} className={field.rows ? 'sm:col-span-2' : ''}>
                  <label className={labelClass} htmlFor={fieldName}>
                    {t(`field_${section}_${field.key}` as Parameters<typeof t>[0])}
                  </label>
                  {field.rows ? (
                    <AutoGrowTextarea
                      id={fieldName}
                      rows={field.rows}
                      className={inputClass}
                      {...form.register(fieldName)}
                    />
                  ) : (
                    <input id={fieldName} className={inputClass} {...form.register(fieldName)} />
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {form.formState.errors.root ? (
        <p className="text-sm text-danger">{form.formState.errors.root.message}</p>
      ) : null}

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={form.formState.isSubmitting}
          className={buttonClasses('primary', '', 'sm')}
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
