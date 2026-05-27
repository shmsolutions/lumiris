'use client';

import { useTranslations } from 'next-intl';

export type SoapValues = {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
};

type SoapEditorProps = {
  value: SoapValues;
  onChange: (next: SoapValues) => void;
  disabled?: boolean;
};

const fieldClass =
  'mt-1.5 w-full rounded-md border border-ink-200 bg-surface-elevated px-3 py-2 text-sm text-ink-900 transition placeholder:text-ink-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:bg-ink-50';

const labelClass = 'block text-xs font-semibold tracking-wide text-ink-600 uppercase';

const sections = ['subjective', 'objective', 'assessment', 'plan'] as const;

export const SoapEditor = (props: SoapEditorProps) => {
  const t = useTranslations('SoapEditor');

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {sections.map((key) => (
        <div key={key}>
          <label className={labelClass} htmlFor={`soap-${key}`}>
            <span className="inline-flex size-5 items-center justify-center rounded-md bg-brand-100 text-[10px] font-bold text-brand-700">
              {t(`letter_${key}` as 'letter_subjective')}
            </span>{' '}
            {t(`label_${key}` as 'label_subjective')}
          </label>
          <textarea
            id={`soap-${key}`}
            rows={5}
            className={fieldClass}
            value={props.value[key]}
            disabled={props.disabled}
            onChange={(event) => {
              props.onChange({ ...props.value, [key]: event.target.value });
            }}
            placeholder={t(`placeholder_${key}` as 'placeholder_subjective')}
          />
        </div>
      ))}
    </div>
  );
};
