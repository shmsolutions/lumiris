'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { buttonClasses } from '@/components/ui/Button';
import { useRouter } from '@/libs/I18nNavigation';
import { TherapistProfileValidation } from '@/validations/TherapistProfileValidation';

type TherapistProfileFormProps = {
  initialValues: {
    therapistName: string;
    crefito: string;
    studentName: string;
  };
};

const inputClass =
  'mt-1.5 w-full rounded-md border border-ink-200 bg-surface-elevated px-3 py-2 text-sm text-ink-900 transition placeholder:text-ink-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200';

const labelClass = 'editorial-label block text-ink-600';

export const TherapistProfileForm = (props: TherapistProfileFormProps) => {
  const t = useTranslations('TherapistProfileForm');
  const router = useRouter();
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const form = useForm({
    resolver: zodResolver(TherapistProfileValidation),
    defaultValues: props.initialValues,
  });

  const onSubmit = form.handleSubmit(async (data) => {
    const response = await fetch('/api/me/profile', {
      method: 'PATCH',
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
      <section className="rounded-xl border border-ink-200 bg-surface-elevated p-6">
        <p className="text-xs text-ink-500">{t('description')}</p>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="therapistName">
              {t('label_name')}
            </label>
            <input
              id="therapistName"
              className={inputClass}
              placeholder={t('placeholder_name')}
              {...form.register('therapistName')}
            />
            <p className="mt-1.5 text-xs text-ink-500">{t('hint_name')}</p>
          </div>

          <div>
            <label className={labelClass} htmlFor="crefito">
              {t('label_crefito')}
            </label>
            <input
              id="crefito"
              className={inputClass}
              placeholder={t('placeholder_crefito')}
              {...form.register('crefito')}
            />
            <p className="mt-1.5 text-xs text-ink-500">{t('hint_crefito')}</p>
          </div>

          <div>
            <label className={labelClass} htmlFor="studentName">
              {t('label_student')}
            </label>
            <input
              id="studentName"
              className={inputClass}
              placeholder={t('placeholder_student')}
              {...form.register('studentName')}
            />
            <p className="mt-1.5 text-xs text-ink-500">{t('hint_student')}</p>
          </div>
        </div>
      </section>

      {form.formState.errors.root ? (
        <p className="text-sm text-danger">{form.formState.errors.root.message}</p>
      ) : null}

      <div className="flex flex-wrap items-center gap-4">
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
