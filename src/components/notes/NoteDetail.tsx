'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { EvolutionEditor } from '@/components/notes/EvolutionEditor';
import type { EvolutionValues } from '@/components/notes/EvolutionEditor';
import { useRouter } from '@/libs/I18nNavigation';

type NoteDetailProps = {
  patientId: string;
  noteId: string;
  initialValues: EvolutionValues & { transcript: string };
};

export const NoteDetail = (props: NoteDetailProps) => {
  const t = useTranslations('NoteDetail');
  const tCommon = useTranslations('Common');
  const router = useRouter();

  const [evolution, setEvolution] = useState<EvolutionValues>({
    procedimento: props.initialValues.procedimento,
    intercorrencia: props.initialValues.intercorrencia,
    evolucao: props.initialValues.evolucao,
  });
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
      body: JSON.stringify(evolution),
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
        <p className="rounded-lg bg-accent-50 px-4 py-2.5 text-xs text-accent-700">
          {t('ai_disclaimer')}
        </p>
      ) : null}

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

      <EvolutionEditor value={evolution} onChange={setEvolution} disabled={saving || deleting} />

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

        <ConfirmDialog
          title={t('confirm_delete')}
          confirmLabel={t('delete')}
          cancelLabel={tCommon('cancel')}
          onConfirm={remove}
          triggerLabel={t('delete')}
          busyLabel={t('deleting')}
          busy={deleting}
          disabled={saving || deleting}
          triggerClassName="inline-flex min-h-11 items-center text-xs text-danger transition hover:underline disabled:opacity-50"
        />
      </div>
    </div>
  );
};
