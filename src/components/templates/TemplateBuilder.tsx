'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import type * as z from 'zod';
import { CloseIcon, PlusIcon } from '@/components/dashboard/Icons';
import { Select } from '@/components/forms/Select';
import { AutoGrowTextarea } from '@/components/ui/AutoGrowTextarea';
import { buttonClasses } from '@/components/ui/Button';
import { useRouter } from '@/libs/I18nNavigation';
import {
  FILL_MODES,
  INPUT_TYPES,
  SECTION_TYPES,
  TemplateUpdateValidation,
} from '@/validations/TemplateValidation';
import type { DocType } from '@/validations/TemplateValidation';

type FormValues = z.input<typeof TemplateUpdateValidation>;

type TemplateBuilderProps = {
  docType: DocType;
  /** Quando presente, edita; senão cria. */
  templateId?: string;
  initialValues: FormValues;
};

const inputClass =
  'mt-1.5 w-full rounded-md border border-ink-200 bg-surface-elevated px-3 py-2 text-sm text-ink-900 transition placeholder:text-ink-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200';
const labelClass = 'editorial-label block text-ink-600';

const makeKey = (prefix: string) => `${prefix}${Math.random().toString(36).slice(2, 10)}`;

const SectionFields = (props: { form: UseFormReturn<FormValues>; sectionIndex: number }) => {
  const t = useTranslations('TemplateBuilder');
  const fields = useFieldArray({
    control: props.form.control,
    name: `definition.sections.${props.sectionIndex}.fields`,
  });

  return (
    <div className="mt-4 space-y-3 border-t border-ink-200 pt-4">
      {fields.fields.map((field, fieldIndex) => (
        <div key={field.id} className="rounded-lg border border-ink-200 bg-surface p-3">
          <div className="flex items-start gap-3">
            <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={labelClass}>{t('field_label')}</label>
                <input
                  className={inputClass}
                  placeholder={t('field_label_placeholder')}
                  {...props.form.register(
                    `definition.sections.${props.sectionIndex}.fields.${fieldIndex}.label`,
                  )}
                />
              </div>
              <div>
                <label className={labelClass}>{t('field_input_type')}</label>
                <Controller
                  control={props.form.control}
                  name={`definition.sections.${props.sectionIndex}.fields.${fieldIndex}.inputType`}
                  render={({ field: ctl }) => (
                    <Select
                      ariaLabel={t('field_input_type')}
                      onChange={ctl.onChange}
                      options={INPUT_TYPES.map((type) => ({
                        value: type,
                        label: t(`input_${type}` as 'input_text'),
                      }))}
                      value={ctl.value ?? ''}
                    />
                  )}
                />
              </div>
              <div>
                <label className={labelClass}>{t('field_fill_mode')}</label>
                <Controller
                  control={props.form.control}
                  name={`definition.sections.${props.sectionIndex}.fields.${fieldIndex}.fillMode`}
                  render={({ field: ctl }) => (
                    <Select
                      ariaLabel={t('field_fill_mode')}
                      groups={[
                        { options: [{ value: 'manual', label: t('fill_manual') }] },
                        {
                          label: t('fill_group_auto'),
                          options: FILL_MODES.filter((mode) => mode !== 'manual').map((mode) => ({
                            value: mode,
                            label: t(`fill_${mode}` as 'fill_manual'),
                          })),
                        },
                      ]}
                      onChange={ctl.onChange}
                      value={ctl.value ?? ''}
                    />
                  )}
                />
                <p className="mt-1.5 text-xs text-ink-500">{t('field_fill_mode_hint')}</p>
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>{t('field_guide')}</label>
                <AutoGrowTextarea
                  rows={2}
                  className={inputClass}
                  placeholder={t('field_guide_placeholder')}
                  {...props.form.register(
                    `definition.sections.${props.sectionIndex}.fields.${fieldIndex}.guide`,
                  )}
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                fields.remove(fieldIndex);
              }}
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-md text-ink-400 transition hover:bg-ink-100 hover:text-danger"
              aria-label={t('field_remove')}
            >
              <CloseIcon size={16} />
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() => {
          fields.append({
            key: makeKey('f'),
            label: '',
            inputType: 'textarea',
            fillMode: 'manual',
            guide: '',
          });
        }}
        className={buttonClasses('secondary', '', 'sm')}
      >
        <PlusIcon size={14} />
        {t('add_field')}
      </button>
    </div>
  );
};

export const TemplateBuilder = (props: TemplateBuilderProps) => {
  const t = useTranslations('TemplateBuilder');
  const router = useRouter();
  const [savedError, setSavedError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(TemplateUpdateValidation),
    defaultValues: props.initialValues,
  });

  const sections = useFieldArray({ control: form.control, name: 'definition.sections' });

  const onSubmit = form.handleSubmit(async (data) => {
    setSavedError(null);
    const url = props.templateId ? `/api/templates/${props.templateId}` : '/api/templates';
    const method = props.templateId ? 'PUT' : 'POST';
    const body = props.templateId ? data : { ...data, docType: props.docType };
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      setSavedError(t('error_save'));
      return;
    }
    router.push('/dashboard/modelos/');
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <section className="space-y-5 rounded-xl border border-ink-200 bg-surface-elevated p-6">
        <div>
          <label className={labelClass} htmlFor="template-name">
            {t('label_name')}
          </label>
          <input
            id="template-name"
            className={inputClass}
            placeholder={t('placeholder_name')}
            {...form.register('name')}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="template-description">
            {t('label_description')}
          </label>
          <AutoGrowTextarea
            id="template-description"
            rows={2}
            className={inputClass}
            placeholder={t('placeholder_description')}
            {...form.register('description')}
          />
        </div>
      </section>

      <section className="rounded-xl border border-ink-200 bg-surface-elevated p-6">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-sm font-semibold tracking-wider text-ink-500 uppercase">
              {t('sections_title')}
            </h2>
            <p className="mt-1 text-xs text-ink-500">{t('sections_description')}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              sections.append({
                key: makeKey('s'),
                type: 'narrative',
                title: '',
                guide: '',
                fields: [],
              });
            }}
            className={buttonClasses('primary', '', 'sm')}
          >
            <PlusIcon size={14} />
            {t('add_section')}
          </button>
        </div>

        {sections.fields.length === 0 ? (
          <div className="rounded-lg border border-dashed border-ink-300 px-5 py-8 text-center text-sm text-ink-500">
            {t('sections_empty')}
          </div>
        ) : (
          <ul className="space-y-4">
            {sections.fields.map((section, index) => (
              <li key={section.id} className="rounded-xl border border-ink-200 bg-surface p-4">
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                      <div>
                        <label className={labelClass}>{t('section_label')}</label>
                        <input
                          className={inputClass}
                          placeholder={t('section_label_placeholder')}
                          {...form.register(`definition.sections.${index}.title`)}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>{t('section_type')}</label>
                        <Controller
                          control={form.control}
                          name={`definition.sections.${index}.type`}
                          render={({ field }) => (
                            <Select
                              ariaLabel={t('section_type')}
                              onChange={field.onChange}
                              options={SECTION_TYPES.map((type) => ({
                                value: type,
                                label: t(`section_type_${type}` as 'section_type_header'),
                              }))}
                              value={field.value ?? ''}
                            />
                          )}
                        />
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className={labelClass}>{t('section_guide')}</label>
                      <AutoGrowTextarea
                        rows={2}
                        className={inputClass}
                        placeholder={t('section_guide_placeholder')}
                        {...form.register(`definition.sections.${index}.guide`)}
                      />
                    </div>
                    <SectionFields form={form} sectionIndex={index} />
                  </div>

                  <div className="flex shrink-0 flex-col gap-1">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => {
                        sections.move(index, index - 1);
                      }}
                      className="inline-flex size-9 items-center justify-center rounded-md text-ink-400 transition hover:bg-ink-100 disabled:opacity-30"
                      aria-label={t('move_up')}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      disabled={index === sections.fields.length - 1}
                      onClick={() => {
                        sections.move(index, index + 1);
                      }}
                      className="inline-flex size-9 items-center justify-center rounded-md text-ink-400 transition hover:bg-ink-100 disabled:opacity-30"
                      aria-label={t('move_down')}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        sections.remove(index);
                      }}
                      className="inline-flex size-9 items-center justify-center rounded-md text-ink-400 transition hover:bg-ink-100 hover:text-danger"
                      aria-label={t('section_remove')}
                    >
                      <CloseIcon size={16} />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {savedError ? <p className="text-sm text-danger">{savedError}</p> : null}

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={form.formState.isSubmitting}
          className={buttonClasses('primary', '', 'sm')}
        >
          {form.formState.isSubmitting ? t('button_saving') : t('button_save')}
        </button>
      </div>
    </form>
  );
};
