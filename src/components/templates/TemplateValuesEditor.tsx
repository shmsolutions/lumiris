'use client';

import { useTranslations } from 'next-intl';
import { CloseIcon, PlusIcon } from '@/components/dashboard/Icons';
import { buttonClasses } from '@/components/ui/Button';
import type { TemplateValues } from '@/libs/TemplateSchema';
import type { TemplateDefinition } from '@/validations/TemplateValidation';

type TemplateValuesEditorProps = {
  definition: TemplateDefinition;
  values: TemplateValues;
  onChange: (values: TemplateValues) => void;
  disabled?: boolean;
};

const inputClass =
  'mt-1.5 w-full rounded-md border border-ink-200 bg-surface-elevated px-3 py-2 text-sm text-ink-900 transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200';
const labelClass = 'editorial-label block text-ink-600';

type ObjectiveRow = { title: string; progress: string };

/** Editor genérico dirigido por um modelo: edita os campos `manual` e tabelas de objetivos. */
export const TemplateValuesEditor = (props: TemplateValuesEditorProps) => {
  const t = useTranslations('TemplateValuesEditor');

  const setValue = (key: string, value: TemplateValues[string]) => {
    props.onChange({ ...props.values, [key]: value });
  };

  const rowsOf = (key: string): ObjectiveRow[] =>
    Array.isArray(props.values[key]) ? (props.values[key] as ObjectiveRow[]) : [];

  return (
    <div className="space-y-6">
      {props.definition.sections.map((section) => {
        if (section.type === 'objectives_table') {
          const rows = rowsOf(section.key);
          return (
            <section
              key={section.key}
              className="rounded-xl border border-ink-200 bg-surface-elevated p-6"
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-ink-900">{section.title}</h3>
                <button
                  type="button"
                  disabled={props.disabled}
                  onClick={() => {
                    setValue(section.key, [...rows, { title: '', progress: '' }]);
                  }}
                  className={buttonClasses('secondary', '', 'sm')}
                >
                  <PlusIcon size={14} />
                  {t('add_row')}
                </button>
              </div>
              <ul className="space-y-3">
                {rows.map((row, index) => (
                  <li key={`${section.key}-${index}`} className="flex items-start gap-3">
                    <div className="min-w-0 flex-1 space-y-2">
                      <input
                        aria-label={t('row_title')}
                        className={inputClass}
                        placeholder={t('row_title')}
                        value={row.title}
                        disabled={props.disabled}
                        onChange={(e) => {
                          const next = [...rows];
                          next[index] = { ...row, title: e.target.value };
                          setValue(section.key, next);
                        }}
                      />
                      <textarea
                        aria-label={t('row_progress')}
                        className={inputClass}
                        rows={2}
                        placeholder={t('row_progress')}
                        value={row.progress}
                        disabled={props.disabled}
                        onChange={(e) => {
                          const next = [...rows];
                          next[index] = { ...row, progress: e.target.value };
                          setValue(section.key, next);
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      disabled={props.disabled}
                      onClick={() => {
                        setValue(
                          section.key,
                          rows.filter((_, i) => i !== index),
                        );
                      }}
                      className="inline-flex size-10 shrink-0 items-center justify-center rounded-md text-ink-400 transition hover:bg-ink-100 hover:text-danger"
                      aria-label={t('remove_row')}
                    >
                      <CloseIcon size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          );
        }

        const editable = section.fields.filter((f) => f.fillMode === 'manual');
        if (editable.length === 0) {
          return null;
        }
        return (
          <section
            key={section.key}
            className="rounded-xl border border-ink-200 bg-surface-elevated p-6"
          >
            <h3 className="mb-3 text-sm font-semibold text-ink-900">{section.title}</h3>
            <div className="space-y-4">
              {editable.map((field) => (
                <div key={field.key}>
                  <label className={labelClass} htmlFor={`tpl-${field.key}`}>
                    {field.label}
                  </label>
                  <textarea
                    id={`tpl-${field.key}`}
                    aria-label={field.label}
                    rows={3}
                    className={inputClass}
                    disabled={props.disabled}
                    value={
                      typeof props.values[field.key] === 'string'
                        ? (props.values[field.key] as string)
                        : ''
                    }
                    onChange={(e) => {
                      setValue(field.key, e.target.value);
                    }}
                  />
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
};
