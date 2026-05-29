'use client';

import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';
import { useRouter } from '@/libs/I18nNavigation';

type SignatureUploaderProps = {
  allowed: boolean;
  initialSignatureUrl: string | null;
};

export const SignatureUploader = (props: SignatureUploaderProps) => {
  const t = useTranslations('SignatureSettings');
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File) => {
    setBusy(true);
    setError(null);
    const body = new FormData();
    body.append('file', file);
    const response = await fetch('/api/me/signature', { method: 'POST', body });
    setBusy(false);
    if (!response.ok) {
      setError(t('error'));
      return;
    }
    router.refresh();
  };

  const remove = async () => {
    setBusy(true);
    setError(null);
    const response = await fetch('/api/me/signature', { method: 'DELETE' });
    setBusy(false);
    if (!response.ok) {
      setError(t('error'));
      return;
    }
    router.refresh();
  };

  return (
    <section className="rounded-xl border border-ink-200 bg-surface-elevated p-6">
      <h3 className="text-sm font-semibold text-ink-900">{t('title')}</h3>
      <p className="mt-1 text-xs text-ink-500">{t('description')}</p>

      {props.allowed ? (
        <div className="mt-4 space-y-3">
          {props.initialSignatureUrl ? (
            // biome-ignore lint/performance/noImgElement: data URL preview, not a remote asset
            <img
              src={props.initialSignatureUrl}
              alt={t('current_alt')}
              className="h-16 rounded-md border border-ink-200 bg-white object-contain p-2"
            />
          ) : (
            <p className="text-xs text-ink-400">{t('empty')}</p>
          )}

          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                void upload(file);
              }
            }}
          />

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 disabled:opacity-50"
            >
              {busy ? t('saving') : t('upload')}
            </button>
            {props.initialSignatureUrl ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  void remove();
                }}
                className="text-xs font-medium text-danger transition hover:underline disabled:opacity-50"
              >
                {t('remove')}
              </button>
            ) : null}
          </div>

          <p className="text-xs text-ink-400">{t('hint')}</p>
          {error ? <p className="text-xs text-danger">{error}</p> : null}
        </div>
      ) : (
        <p className="mt-4 text-xs text-ink-500">{t('locked')}</p>
      )}
    </section>
  );
};
