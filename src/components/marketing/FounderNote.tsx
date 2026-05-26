import { useTranslations } from 'next-intl';

export const FounderNote = () => {
  const t = useTranslations('Landing');

  return (
    <section className="border-b border-ink-200/60 bg-surface">
      <div className="mx-auto max-w-3xl px-6 py-20">
        <div className="rounded-2xl border border-ink-200 bg-surface-elevated p-8 sm:p-10">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium tracking-wide text-brand-700 uppercase">
            <span className="size-1.5 rounded-full bg-brand-500" />
            {t('founder_eyebrow')}
          </span>

          <blockquote className="mt-6 text-lg leading-relaxed text-ink-800">
            {t('founder_quote')}
          </blockquote>

          <div className="mt-6 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
              R
            </div>
            <div>
              <div className="text-sm font-semibold text-ink-900">{t('founder_name')}</div>
              <div className="text-xs text-ink-500">{t('founder_role')}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
