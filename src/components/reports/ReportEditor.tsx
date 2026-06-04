'use client';

import { useTranslations } from 'next-intl';
import type { ReportContent } from '@/validations/ReportValidation';

type ReportEditorProps = {
  value: ReportContent;
  onChange: (next: ReportContent) => void;
  disabled?: boolean;
};

const fieldClass =
  'mt-1.5 w-full rounded-md border border-ink-200 bg-surface-elevated px-3 py-2 text-sm text-ink-900 transition placeholder:text-ink-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:bg-ink-50';

const labelClass = 'editorial-label block text-ink-600';

export const ReportEditor = (props: ReportEditorProps) => {
  const t = useTranslations('ReportEditor');
  const v = props.value;

  const set = (patch: Partial<ReportContent>) => {
    props.onChange({ ...v, ...patch });
  };

  const setObjective = (index: number, progress: string) => {
    const next = [...v.objectiveProgress];
    const current = next[index];
    if (!current) {
      return;
    }
    next[index] = { ...current, progress };
    set({ objectiveProgress: next });
  };

  return (
    <div className="space-y-6">
      <section className="space-y-5 rounded-xl border border-ink-200 bg-surface-elevated p-6">
        <div>
          <label className={labelClass} htmlFor="initialComplaint">
            {t('initial_complaint')}
          </label>
          <textarea
            id="initialComplaint"
            rows={2}
            className={fieldClass}
            disabled={props.disabled}
            value={v.initialComplaint}
            onChange={(e) => {
              set({ initialComplaint: e.target.value });
            }}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="generalEvolution">
            {t('general_evolution')}
          </label>
          <textarea
            id="generalEvolution"
            rows={4}
            className={fieldClass}
            disabled={props.disabled}
            value={v.generalEvolution}
            onChange={(e) => {
              set({ generalEvolution: e.target.value });
            }}
          />
        </div>
      </section>

      <section className="rounded-xl border border-ink-200 bg-surface-elevated p-6">
        <h3 className="editorial-label text-ink-500">{t('objective_progress')}</h3>
        {v.objectiveProgress.length === 0 ? (
          <p className="mt-3 text-sm text-ink-500">{t('objective_progress_empty')}</p>
        ) : (
          <div className="mt-4 space-y-4">
            {v.objectiveProgress.map((o, index) => (
              <div key={index} className="rounded-lg border border-ink-200 bg-surface p-4">
                <div className="text-sm font-semibold text-ink-900">{o.title}</div>
                <textarea
                  rows={3}
                  className={fieldClass}
                  disabled={props.disabled}
                  value={o.progress}
                  onChange={(e) => {
                    setObjective(index, e.target.value);
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-5 rounded-xl border border-ink-200 bg-surface-elevated p-6">
        <div>
          <label className={labelClass} htmlFor="difficulties">
            {t('difficulties')}
          </label>
          <textarea
            id="difficulties"
            rows={3}
            className={fieldClass}
            disabled={props.disabled}
            value={v.difficulties}
            onChange={(e) => {
              set({ difficulties: e.target.value });
            }}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="suggestions">
            {t('suggestions')}
          </label>
          <textarea
            id="suggestions"
            rows={3}
            className={fieldClass}
            disabled={props.disabled}
            value={v.suggestions}
            onChange={(e) => {
              set({ suggestions: e.target.value });
            }}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="conclusion">
            {t('conclusion')}
          </label>
          <textarea
            id="conclusion"
            rows={3}
            className={fieldClass}
            disabled={props.disabled}
            value={v.conclusion}
            onChange={(e) => {
              set({ conclusion: e.target.value });
            }}
          />
        </div>
      </section>
    </div>
  );
};
