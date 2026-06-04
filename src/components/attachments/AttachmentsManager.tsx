'use client';

import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { FileIcon, PlusIcon } from '@/components/dashboard/Icons';
import { buttonClasses } from '@/components/ui/Button';
import { useRouter } from '@/libs/I18nNavigation';

type Attachment = {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  category: string;
};

type AttachmentsManagerProps = {
  patientId: string;
  initialAttachments: Attachment[];
};

const categories = ['laudo', 'parecer', 'outro'] as const;

const formatSize = (bytes: number) => {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const AttachmentsManager = (props: AttachmentsManagerProps) => {
  const t = useTranslations('AttachmentsManager');
  const tCommon = useTranslations('Common');
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState<(typeof categories)[number]>('laudo');
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const upload = async (file: File) => {
    setErrorMessage(null);
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);

    const response = await fetch(`/api/patients/${props.patientId}/attachments`, {
      method: 'POST',
      body: formData,
    });
    setUploading(false);

    if (!response.ok) {
      const { error } = (await response.json().catch(() => ({}))) as { error?: string };
      if (error === 'too_large') {
        setErrorMessage(t('error_too_large'));
      } else if (error === 'invalid_type') {
        setErrorMessage(t('error_invalid_type'));
      } else {
        setErrorMessage(t('error_generic'));
      }
      return;
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    router.refresh();
  };

  const remove = async (attachmentId: string) => {
    setDeletingId(attachmentId);
    const response = await fetch(`/api/patients/${props.patientId}/attachments/${attachmentId}`, {
      method: 'DELETE',
    });
    setDeletingId(null);
    if (!response.ok) {
      setErrorMessage(t('error_delete'));
      return;
    }
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-ink-200 bg-surface-elevated p-6">
        <h2 className="editorial-label text-ink-500">{t('upload_title')}</h2>
        <p className="mt-1 text-xs text-ink-500">{t('upload_hint')}</p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-md bg-ink-100 p-1">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setCategory(cat);
                }}
                className={`rounded px-3 py-1.5 text-xs font-semibold transition ${
                  category === cat
                    ? 'bg-surface-elevated text-ink-900 shadow-sm'
                    : 'text-ink-500 hover:text-ink-700'
                }`}
              >
                {t(`category_${cat}` as 'category_laudo')}
              </button>
            ))}
          </div>

          <input
            ref={fileInputRef}
            aria-label={t('upload_button')}
            type="file"
            accept="application/pdf,image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                void upload(file);
              }
            }}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className={buttonClasses('primary', '', 'sm')}
          >
            <PlusIcon size={14} />
            {uploading ? t('uploading') : t('upload_button')}
          </button>
        </div>

        {errorMessage ? <p className="mt-3 text-sm text-danger">{errorMessage}</p> : null}
      </section>

      {props.initialAttachments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-ink-300 bg-surface-elevated px-6 py-10 text-center text-sm text-ink-500">
          {t('empty')}
        </div>
      ) : (
        <ul className="divide-y divide-ink-200 overflow-hidden rounded-xl border border-ink-200 bg-surface-elevated">
          {props.initialAttachments.map((att) => (
            <li key={att.id} className="flex items-center gap-3 px-5 py-3">
              <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-ink-100 text-ink-500">
                <FileIcon size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <a
                  href={`/api/patients/${props.patientId}/attachments/${att.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="truncate text-sm font-medium text-ink-900 hover:text-brand-700"
                >
                  {att.fileName}
                </a>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-ink-500">
                  <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-ink-600 uppercase">
                    {t(`category_${att.category}` as 'category_laudo')}
                  </span>
                  <span>{formatSize(att.sizeBytes)}</span>
                </div>
              </div>
              <ConfirmDialog
                title={t('confirm_delete')}
                confirmLabel={t('delete')}
                cancelLabel={tCommon('cancel')}
                onConfirm={() => {
                  void remove(att.id);
                }}
                triggerLabel={t('delete')}
                busyLabel={t('deleting')}
                busy={deletingId === att.id}
                triggerClassName="inline-flex min-h-11 items-center text-xs text-danger transition hover:underline disabled:opacity-50"
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
