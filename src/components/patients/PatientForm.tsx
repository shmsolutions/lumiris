'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { buttonClasses } from '@/components/ui/Button';
import { Link, useRouter } from '@/libs/I18nNavigation';
import { PatientCreateValidation } from '@/validations/PatientValidation';

const inputClass =
  'mt-1.5 w-full rounded-md border border-ink-200 bg-surface-elevated px-3 py-2 text-sm text-ink-900 transition placeholder:text-ink-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200';

const labelClass = 'editorial-label block text-ink-600';

type PatientFormValues = {
  fullName: string;
  birthDate: string;
  guardianName: string;
  guardianRelation: string;
  contactPhone: string;
  contactEmail: string;
  naturality: string;
  maritalStatus: string;
  gender: string;
  profession: string;
  residentialAddress: string;
  commercialAddress: string;
  diagnosis: string;
  cid: string;
  mainComplaint: string;
  school: string;
  otherProfessionals: string;
  notes: string;
};

type PatientFormProps = {
  mode?: 'create' | 'edit';
  patientId?: string;
  initialValues?: Partial<PatientFormValues>;
};

const blankValues: PatientFormValues = {
  fullName: '',
  birthDate: '',
  guardianName: '',
  guardianRelation: '',
  contactPhone: '',
  contactEmail: '',
  naturality: '',
  maritalStatus: '',
  gender: '',
  profession: '',
  residentialAddress: '',
  commercialAddress: '',
  diagnosis: '',
  cid: '',
  mainComplaint: '',
  school: '',
  otherProfessionals: '',
  notes: '',
};

export const PatientForm = (props: PatientFormProps) => {
  const t = useTranslations('PatientForm');
  const tCommon = useTranslations('Common');
  const router = useRouter();
  const mode = props.mode ?? 'create';
  const isEdit = mode === 'edit';
  const [archiving, setArchiving] = useState(false);
  const [consent, setConsent] = useState(false);

  const form = useForm({
    resolver: zodResolver(PatientCreateValidation),
    defaultValues: { ...blankValues, ...props.initialValues },
  });

  // Crianças/adolescentes não têm estado civil nem profissão — o formulário se
  // adapta ao tipo de paciente. Em edição, inferimos pelo que já está preenchido.
  const [patientType, setPatientType] = useState<'child' | 'adult'>(
    props.initialValues?.maritalStatus || props.initialValues?.profession ? 'adult' : 'child',
  );
  const isAdult = patientType === 'adult';

  const changePatientType = (type: 'child' | 'adult') => {
    setPatientType(type);
    if (type === 'child') {
      form.setValue('maritalStatus', '');
      form.setValue('profession', '');
    }
  };

  const onSubmit = form.handleSubmit(async (data) => {
    const url = isEdit && props.patientId ? `/api/patients/${props.patientId}` : '/api/patients';
    const method = isEdit ? 'PATCH' : 'POST';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const data2 = (await response.json().catch(() => ({}))) as {
        error?: string;
        limit?: number;
      };
      if (data2.error === 'plan_limit') {
        form.setError('root', {
          message: t('error_plan_limit', { limit: data2.limit ?? 0 }),
        });
      } else {
        form.setError('root', { message: t('error_generic') });
      }
      return;
    }

    if (isEdit && props.patientId) {
      router.push(`/dashboard/patients/${props.patientId}/`);
    } else {
      const json = (await response.json()) as { patient: { id: string } };
      router.push(`/dashboard/patients/${json.patient.id}/`);
    }
    router.refresh();
  });

  const archive = async () => {
    if (!props.patientId) {
      return;
    }
    setArchiving(true);
    const response = await fetch(`/api/patients/${props.patientId}`, { method: 'DELETE' });
    if (!response.ok) {
      setArchiving(false);
      form.setError('root', { message: t('error_archive') });
      return;
    }
    router.push('/dashboard/patients/');
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="max-w-3xl space-y-8">
      <section className="rounded-xl border border-ink-200 bg-surface-elevated p-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <span className={labelClass}>{t('label_patient_type')}</span>
            <div className="mt-1.5 inline-flex rounded-md border border-ink-200 bg-surface p-0.5">
              {(['child', 'adult'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  aria-pressed={patientType === type}
                  onClick={() => {
                    changePatientType(type);
                  }}
                  className={`rounded px-4 py-1.5 text-sm font-medium transition ${
                    patientType === type
                      ? 'bg-brand-500 text-white shadow-sm'
                      : 'text-ink-600 hover:text-ink-900'
                  }`}
                >
                  {t(type === 'child' ? 'type_child' : 'type_adult')}
                </button>
              ))}
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="fullName">
              {t('label_full_name')}
            </label>
            <input id="fullName" className={inputClass} {...form.register('fullName')} />
            {form.formState.errors.fullName ? (
              <p className="mt-1.5 text-xs text-danger">{t('error_full_name')}</p>
            ) : null}
          </div>

          <div>
            <label className={labelClass} htmlFor="birthDate">
              {t('label_birth_date')}
            </label>
            <input
              id="birthDate"
              type="date"
              className={inputClass}
              {...form.register('birthDate')}
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="contactPhone">
              {t('label_contact_phone')}
            </label>
            <input id="contactPhone" className={inputClass} {...form.register('contactPhone')} />
          </div>

          <div>
            <label className={labelClass} htmlFor="guardianName">
              {t('label_guardian_name')}
            </label>
            <input id="guardianName" className={inputClass} {...form.register('guardianName')} />
          </div>

          <div>
            <label className={labelClass} htmlFor="guardianRelation">
              {t('label_guardian_relation')}
            </label>
            <input
              id="guardianRelation"
              className={inputClass}
              {...form.register('guardianRelation')}
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="contactEmail">
              {t('label_contact_email')}
            </label>
            <input
              id="contactEmail"
              type="email"
              className={inputClass}
              {...form.register('contactEmail')}
            />
            {form.formState.errors.contactEmail ? (
              <p className="mt-1.5 text-xs text-danger">{t('error_contact_email')}</p>
            ) : null}
          </div>

          <div>
            <label className={labelClass} htmlFor="gender">
              {t('label_gender')}
            </label>
            <input id="gender" className={inputClass} {...form.register('gender')} />
          </div>

          {isAdult ? (
            <div>
              <label className={labelClass} htmlFor="maritalStatus">
                {t('label_marital_status')}
              </label>
              <input
                id="maritalStatus"
                className={inputClass}
                {...form.register('maritalStatus')}
              />
            </div>
          ) : null}

          <div>
            <label className={labelClass} htmlFor="naturality">
              {t('label_naturality')}
            </label>
            <input id="naturality" className={inputClass} {...form.register('naturality')} />
          </div>

          {isAdult ? (
            <div>
              <label className={labelClass} htmlFor="profession">
                {t('label_profession')}
              </label>
              <input id="profession" className={inputClass} {...form.register('profession')} />
            </div>
          ) : null}

          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="residentialAddress">
              {t('label_residential_address')}
            </label>
            <input
              id="residentialAddress"
              className={inputClass}
              {...form.register('residentialAddress')}
            />
          </div>

          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="commercialAddress">
              {t('label_commercial_address')}
            </label>
            <input
              id="commercialAddress"
              className={inputClass}
              {...form.register('commercialAddress')}
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="cid">
              {t('label_cid')}
            </label>
            <input id="cid" className={inputClass} {...form.register('cid')} />
          </div>
        </div>
      </section>

      <section className="space-y-5 rounded-xl border border-ink-200 bg-surface-elevated p-6">
        <div>
          <label className={labelClass} htmlFor="diagnosis">
            {t('label_diagnosis')}
          </label>
          <textarea
            id="diagnosis"
            rows={2}
            className={inputClass}
            {...form.register('diagnosis')}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="mainComplaint">
            {t('label_main_complaint')}
          </label>
          <textarea
            id="mainComplaint"
            rows={3}
            className={inputClass}
            {...form.register('mainComplaint')}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="school">
            {t('label_school')}
          </label>
          <input id="school" className={inputClass} {...form.register('school')} />
        </div>

        <div>
          <label className={labelClass} htmlFor="otherProfessionals">
            {t('label_other_professionals')}
          </label>
          <textarea
            id="otherProfessionals"
            rows={2}
            className={inputClass}
            {...form.register('otherProfessionals')}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="notes">
            {t('label_notes')}
          </label>
          <textarea id="notes" rows={3} className={inputClass} {...form.register('notes')} />
        </div>
      </section>

      {form.formState.errors.root ? (
        <p className="text-sm text-danger">{form.formState.errors.root.message}</p>
      ) : null}

      {isEdit ? null : (
        <label className="flex items-start gap-3 rounded-lg border border-ink-200 bg-ink-50/60 px-4 py-3 text-sm text-ink-600">
          <input
            type="checkbox"
            checked={consent}
            onChange={(event) => {
              setConsent(event.target.checked);
            }}
            className="mt-0.5 size-4 rounded border-ink-300 text-brand-500 focus:ring-brand-300"
          />
          <span>
            {t.rich('consent_label', {
              priv: (chunks) => (
                <Link
                  href="/privacy/"
                  className="text-brand-600 underline-offset-4 hover:underline"
                >
                  {chunks}
                </Link>
              ),
            })}
          </span>
        </label>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="submit"
          disabled={form.formState.isSubmitting || archiving || (!isEdit && !consent)}
          className={buttonClasses('primary', '', 'sm')}
        >
          {form.formState.isSubmitting
            ? t('button_saving')
            : (isEdit
              ? t('button_update')
              : t('button_save'))}
        </button>

        {isEdit ? (
          <ConfirmDialog
            title={t('confirm_archive')}
            confirmLabel={t('archive')}
            cancelLabel={tCommon('cancel')}
            onConfirm={archive}
            triggerLabel={t('archive')}
            busyLabel={t('archiving')}
            busy={archiving}
            disabled={archiving || form.formState.isSubmitting}
            triggerClassName="inline-flex min-h-11 items-center text-xs text-danger transition hover:underline disabled:opacity-50"
          />
        ) : null}
      </div>
    </form>
  );
};
