'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { AnamnesisForm } from '@/components/patients/AnamnesisForm';
import { TemplateValuesEditor } from '@/components/templates/TemplateValuesEditor';
import { useRouter } from '@/libs/I18nNavigation';
import type { TemplateValues } from '@/libs/TemplateSchema';
import type { AnamnesisData } from '@/validations/AnamnesisValidation';
import type { TemplateDefinition } from '@/validations/TemplateValidation';

type AnamnesisTemplateOption = { id: string; name: string; definition: TemplateDefinition };

type AnamnesisEditorProps = {
  patientId: string;
  initialData: AnamnesisData;
  templates: AnamnesisTemplateOption[];
  initialTemplateId: string;
  initialValues: TemplateValues;
};

const labelClass = 'block text-xs font-semibold tracking-wide text-ink-600 uppercase';
const selectClass =
  'mt-1.5 w-full max-w-md rounded-md border border-ink-200 bg-surface-elevated px-3 py-2 text-sm text-ink-900 transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200';

export const AnamnesisEditor = (props: AnamnesisEditorProps) => {
  const t = useTranslations('AnamnesisPage');
  const router = useRouter();
  const [templateId, setTemplateId] = useState(props.initialTemplateId);
  const [values, setValues] = useState<TemplateValues>(props.initialValues);
  const [busy, setBusy] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedTemplate = props.templates.find((tpl) => tpl.id === templateId) ?? null;

  const saveCustom = async () => {
    setBusy(true);
    setError(null);
    const response = await fetch(`/api/patients/${props.patientId}/anamnesis`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ templateId, values }),
    });
    setBusy(false);
    if (!response.ok) {
      setError(t('tpl_error'));
      return;
    }
    setSavedAt(new Date());
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {props.templates.length > 0 ? (
        <div>
          <label className={labelClass} htmlFor="anamnesisTemplate">
            {t('tpl_label')}
          </label>
          <select
            id="anamnesisTemplate"
            className={selectClass}
            value={templateId}
            onChange={(e) => {
              setTemplateId(e.target.value);
            }}
          >
            <option value="">{t('tpl_default')}</option>
            {props.templates.map((tpl) => (
              <option key={tpl.id} value={tpl.id}>
                {tpl.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {selectedTemplate ? (
        <div className="space-y-6">
          <TemplateValuesEditor
            definition={selectedTemplate.definition}
            values={values}
            onChange={setValues}
            disabled={busy}
          />
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              disabled={busy}
              onClick={saveCustom}
              className="inline-flex items-center rounded-md bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 disabled:opacity-50"
            >
              {busy ? t('tpl_saving') : t('tpl_save')}
            </button>
            {savedAt ? (
              <span className="text-xs text-success">
                {t('tpl_saved_at', { time: savedAt.toLocaleTimeString() })}
              </span>
            ) : null}
            {error ? <span className="text-xs text-danger">{error}</span> : null}
          </div>
        </div>
      ) : (
        <AnamnesisForm patientId={props.patientId} initialData={props.initialData} />
      )}
    </div>
  );
};
