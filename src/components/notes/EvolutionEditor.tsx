'use client';

import { useTranslations } from 'next-intl';

export type EvolutionValues = {
  procedimento: string;
  intercorrencia: string;
  evolucao: string;
};

type EvolutionEditorProps = {
  value: EvolutionValues;
  onChange: (next: EvolutionValues) => void;
  disabled?: boolean;
};

const fieldClass =
  'mt-1.5 w-full rounded-md border border-ink-200 bg-surface-elevated px-3 py-2 text-sm text-ink-900 transition placeholder:text-ink-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:bg-ink-50';

const labelClass = 'editorial-label block text-ink-600';

const sections = ['procedimento', 'intercorrencia', 'evolucao'] as const;

export const EvolutionEditor = (props: EvolutionEditorProps) => {
  const t = useTranslations('EvolutionEditor');

  return (
    <div className="space-y-5">
      {sections.map((key) => (
        <div key={key}>
          <label className={labelClass} htmlFor={`evolution-${key}`}>
            {t(`label_${key}` as 'label_procedimento')}
          </label>
          <textarea
            id={`evolution-${key}`}
            rows={key === 'evolucao' ? 6 : 4}
            className={fieldClass}
            value={props.value[key]}
            disabled={props.disabled}
            onChange={(event) => {
              props.onChange({ ...props.value, [key]: event.target.value });
            }}
            placeholder={t(`placeholder_${key}` as 'placeholder_procedimento')}
          />
        </div>
      ))}
    </div>
  );
};
