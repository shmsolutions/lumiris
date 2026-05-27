'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ReportEditor } from '@/components/reports/ReportEditor';
import { useRouter } from '@/libs/I18nNavigation';
import type { ReportContent } from '@/validations/ReportValidation';

type ReportDetailProps = {
  patientId: string;
  reportId: string;
  initialContent: ReportContent;
};

export const ReportDetail = (props: ReportDetailProps) => {
  const t = useTranslations('ReportDetail');
  const tCommon = useTranslations('Common');
  const router = useRouter();
  const [content, setContent] = useState<ReportContent>(props.initialContent);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setErrorMessage(null);
    const response = await fetch(`/api/patients/${props.patientId}/reports/${props.reportId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
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
    const response = await fetch(`/api/patients/${props.patientId}/reports/${props.reportId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      setDeleting(false);
      setErrorMessage(t('error_delete'));
      return;
    }
    router.push(`/dashboard/patients/${props.patientId}/reports/`);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <p className="rounded-lg bg-accent-50 px-4 py-2.5 text-xs text-accent-700">
        {t('ai_disclaimer')}
      </p>

      <ReportEditor value={content} onChange={setContent} disabled={saving || deleting} />

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
