'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { DateTimePicker } from '@/components/forms/DateTimePicker';
import { buttonClasses } from '@/components/ui/Button';
import { useRouter } from '@/libs/I18nNavigation';
import { AppointmentCreateValidation } from '@/validations/AppointmentValidation';

type PatientOption = { id: string; fullName: string };

type AppointmentFormProps = {
  patients: PatientOption[];
  initial?: {
    id?: string;
    patientId?: string;
    startsAt?: string;
    durationMinutes?: number;
    status?: 'scheduled' | 'completed' | 'cancelled';
    notes?: string;
  };
  editingId?: string;
};

const inputClass =
  'mt-1.5 w-full rounded-md border border-ink-200 bg-surface-elevated px-3 py-2 text-sm text-ink-900 transition placeholder:text-ink-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200';

const labelClass = 'editorial-label block text-ink-600';

const durationPresets = [30, 50, 60, 90];

const buildDefaultDateTime = () => {
  const now = new Date();
  now.setHours(now.getHours() + 1, 0, 0, 0);
  const pad = (n: number) => `${n}`.padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
};

export const AppointmentForm = (props: AppointmentFormProps) => {
  const t = useTranslations('AppointmentForm');
  const tCommon = useTranslations('Common');
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const form = useForm({
    resolver: zodResolver(AppointmentCreateValidation),
    defaultValues: {
      patientId: props.initial?.patientId ?? props.patients[0]?.id ?? '',
      startsAt: props.initial?.startsAt ?? buildDefaultDateTime(),
      durationMinutes: props.initial?.durationMinutes ?? 50,
      status: props.initial?.status ?? 'scheduled',
      notes: props.initial?.notes ?? '',
    },
  });

  const isEditing = Boolean(props.editingId);
  const duration = form.watch('durationMinutes');

  const onSubmit = form.handleSubmit(async (data) => {
    const url = props.editingId ? `/api/appointments/${props.editingId}` : '/api/appointments';
    const method = props.editingId ? 'PATCH' : 'POST';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      form.setError('root', { message: t('error_generic') });
      return;
    }

    if (props.editingId) {
      router.push('/dashboard/schedule/');
    } else {
      const json = (await response.json()) as { appointment: { id: string } };
      router.push(`/dashboard/schedule/${json.appointment.id}/`);
    }
    router.refresh();
  });

  const deleteAppointment = async () => {
    if (!props.editingId) {
      return;
    }
    setDeleting(true);
    const response = await fetch(`/api/appointments/${props.editingId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      setDeleting(false);
      form.setError('root', { message: t('error_delete') });
      return;
    }
    router.push('/dashboard/schedule/');
    router.refresh();
  };

  if (props.patients.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-ink-300 bg-surface-elevated p-8 text-center">
        <p className="text-sm text-ink-700">{t('no_patients_title')}</p>
        <p className="mt-1 text-xs text-ink-500">{t('no_patients_hint')}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <section className="space-y-5 rounded-xl border border-ink-200 bg-surface-elevated p-6">
        <div>
          <label className={labelClass} htmlFor="patientId">
            {t('label_patient')}
          </label>
          <select id="patientId" className={inputClass} {...form.register('patientId')}>
            {props.patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.fullName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass} htmlFor="startsAt-trigger">
            {t('label_starts_at')}
          </label>
          <Controller
            control={form.control}
            name="startsAt"
            render={({ field }) => (
              <DateTimePicker id="startsAt-trigger" value={field.value} onChange={field.onChange} />
            )}
          />
        </div>

        <div>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <label className={labelClass} htmlFor="durationMinutes">
              {t('label_duration')}
            </label>
            <div className="flex flex-wrap gap-1">
              {durationPresets.map((min) => {
                const active = duration === min;
                return (
                  <button
                    key={min}
                    type="button"
                    onClick={() => {
                      form.setValue('durationMinutes', min);
                    }}
                    className={`rounded-md border px-2.5 py-1 text-[11px] font-semibold transition ${
                      active
                        ? 'border-brand-400 bg-brand-50 text-brand-700'
                        : 'border-ink-200 bg-surface-elevated text-ink-500 hover:border-ink-300 hover:text-ink-900'
                    }`}
                  >
                    {min}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <input
              id="durationMinutes"
              type="number"
              min={5}
              max={480}
              step={5}
              className={`${inputClass} mt-0 w-32`}
              {...form.register('durationMinutes', { valueAsNumber: true })}
            />
            <span className="text-xs text-ink-500">{t('duration_suffix')}</span>
          </div>
        </div>

        {isEditing ? (
          <div>
            <label className={labelClass} htmlFor="status">
              {t('label_status')}
            </label>
            <select id="status" className={inputClass} {...form.register('status')}>
              <option value="scheduled">{t('status_scheduled')}</option>
              <option value="completed">{t('status_completed')}</option>
              <option value="cancelled">{t('status_cancelled')}</option>
            </select>
          </div>
        ) : null}

        <div>
          <label className={labelClass} htmlFor="notes">
            {t('label_notes')}
          </label>
          <textarea
            id="notes"
            rows={3}
            placeholder={t('placeholder_notes')}
            className={inputClass}
            {...form.register('notes')}
          />
        </div>
      </section>

      {form.formState.errors.root ? (
        <p className="text-sm text-danger">{form.formState.errors.root.message}</p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="submit"
          disabled={form.formState.isSubmitting || deleting}
          className={buttonClasses('primary', '', 'sm')}
        >
          {form.formState.isSubmitting
            ? t('button_saving')
            : (isEditing
              ? t('button_update')
              : t('button_create'))}
        </button>

        {isEditing ? (
          <ConfirmDialog
            title={t('confirm_delete')}
            confirmLabel={t('delete')}
            cancelLabel={tCommon('cancel')}
            onConfirm={deleteAppointment}
            triggerLabel={t('delete')}
            busyLabel={t('deleting')}
            busy={deleting}
            disabled={deleting || form.formState.isSubmitting}
            triggerClassName="inline-flex min-h-11 items-center text-xs text-danger transition hover:underline disabled:opacity-50"
          />
        ) : null}
      </div>
    </form>
  );
};
