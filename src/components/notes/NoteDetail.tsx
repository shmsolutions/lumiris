'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { SoapEditor } from '@/components/notes/SoapEditor';
import type { SoapValues } from '@/components/notes/SoapEditor';
import { useRouter } from '@/libs/I18nNavigation';

type NoteDetailProps = {
  patientId: string;
  noteId: string;
  initialValues: SoapValues & { transcript: string; intercorrencia: string };
};

const intercorrenciaClass =
  'mt-1.5 w-full rounded-md border border-ink-200 bg-surface-elevated px-3 py-2 text-sm text-ink-900 transition placeholder:text-ink-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:bg-ink-50';

export const NoteDetail = (props: NoteDetailProps) => {
  const t = useTranslations('NoteDetail');
  const router = useRouter();

  const [soap, setSoap] = useState<SoapValues>({
    subjective: props.initialValues.subjective,
    objective: props.initialValues.objective,
    assessment: props.initialValues.assessment,
    plan: props.initialValues.plan,
  });
  const [intercorrencia, setIntercorrencia] = useState(props.initialValues.intercorrencia);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const save = async () => {
    setSaving(true);
    setErrorMessage(null);
    const response = await fetch(`/api/patients/${props.patientId}/notes/${props.noteId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...soap, intercorrencia }),
    });
    setSaving(false);
    if (!response.ok) {
      setErrorMessage(t('error_save'));
      return;
    }
    setSavedAt(new Date());
    router.refresh();
  };

  const remove = async () => {
    if (!confirm(t('confirm_delete'))) {
      return;
    }
    setDeleting(true);
    const response = await fetch(`/api/patients/${props.patientId}/notes/${props.noteId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      setDeleting(false);
      setErrorMessage(t('error_delete'));
      return;
    }
    router.push(`/dashboard/patients/${props.patientId}/notes/`);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {props.initialValues.transcript ? (
        <details className="rounded-xl border border-ink-200 bg-surface-elevated">
          <summary className="cursor-pointer list-none px-5 py-3 text-xs font-semibold tracking-wider text-ink-500 uppercase">
            {t('transcript_title')}
          </summary>
          <p className="border-t border-ink-200 px-5 py-4 text-sm leading-relaxed whitespace-pre-wrap text-ink-700">
            {props.initialValues.transcript}
          </p>
        </details>
      ) : null}

      <SoapEditor value={soap} onChange={setSoap} disabled={saving || deleting} />

      <section className="rounded-xl border border-ink-200 bg-surface-elevated p-5">
        <label
          className="block text-xs font-semibold tracking-wide text-ink-600 uppercase"
          htmlFor="intercorrencia"
        >
          {t('intercorrencia_label')}
        </label>
        <p className="mt-1 text-xs text-ink-500">{t('intercorrencia_hint')}</p>
        <textarea
          id="intercorrencia"
          rows={2}
          value={intercorrencia}
          onChange={(event) => {
            setIntercorrencia(event.target.value);
          }}
          disabled={saving || deleting}
          placeholder={t('intercorrencia_placeholder')}
          className={intercorrenciaClass}
        />
      </section>

      {errorMessage ? <p className="text-sm text-danger">{errorMessage}</p> : null}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-200 pt-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={save}
            disabled={saving || deleting}
            className="inline-flex items-center rounded-md bg-brand-500 px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-600 disabled:opacity-50"
          >
            {saving ? t('saving') : t('save')}
          </button>
          {savedAt ? (
            <span className="text-xs text-success">
              {t('saved_at', { time: savedAt.toLocaleTimeString() })}
            </span>
          ) : null}
        </div>

        <button
          type="button"
          onClick={remove}
          disabled={saving || deleting}
          className="text-xs text-danger transition hover:underline disabled:opacity-50"
        >
          {deleting ? t('deleting') : t('delete')}
        </button>
      </div>
    </div>
  );
};
