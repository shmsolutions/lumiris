'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useRouter } from '@/libs/I18nNavigation';

export const DeleteTemplateButton = (props: { templateId: string }) => {
  const t = useTranslations('TemplatesPage');
  const tCommon = useTranslations('Common');
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const remove = async () => {
    setBusy(true);
    const response = await fetch(`/api/templates/${props.templateId}`, { method: 'DELETE' });
    setBusy(false);
    if (response.ok) {
      router.refresh();
    }
  };

  return (
    <ConfirmDialog
      title={t('delete_confirm')}
      confirmLabel={t('delete')}
      cancelLabel={tCommon('cancel')}
      onConfirm={remove}
      triggerLabel={t('delete')}
      busy={busy}
      busyLabel={t('deleting')}
      disabled={busy}
      triggerClassName="text-xs font-medium text-danger transition hover:underline disabled:opacity-50"
    />
  );
};
