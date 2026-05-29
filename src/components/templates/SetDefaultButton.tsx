'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useRouter } from '@/libs/I18nNavigation';
import type { DocType } from '@/validations/TemplateValidation';

type SetDefaultButtonProps = {
  docType: DocType;
  /** null = o modelo padrão CREFITO (em código). */
  templateId: string | null;
  isDefault: boolean;
};

export const SetDefaultButton = (props: SetDefaultButtonProps) => {
  const t = useTranslations('TemplatesPage');
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  if (props.isDefault) {
    return (
      <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-medium text-brand-700">
        {t('badge_default')}
      </span>
    );
  }

  const setDefault = async () => {
    setBusy(true);
    const response = await fetch('/api/me/default-templates', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ docType: props.docType, templateId: props.templateId }),
    });
    setBusy(false);
    if (response.ok) {
      router.refresh();
    }
  };

  return (
    <button
      type="button"
      disabled={busy}
      onClick={setDefault}
      className="text-xs font-medium text-ink-500 transition hover:text-ink-800 disabled:opacity-50"
    >
      {t('set_default')}
    </button>
  );
};
