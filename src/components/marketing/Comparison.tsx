import { useTranslations } from 'next-intl';

const rows = ['a', 'b', 'c', 'd', 'e'] as const;

export const Comparison = () => {
  const t = useTranslations('Landing');

  return (
    <section className="border-b border-ink-200/60 bg-ink-50">
      <div className="mx-auto max-w-5xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium tracking-wider text-brand-700 uppercase">
            {t('compare_eyebrow')}
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
            {t('compare_title')}
          </h2>
          <p className="mt-3 text-base text-ink-600">{t('compare_subtitle')}</p>
        </div>

        <div className="mx-auto mt-12 overflow-hidden rounded-2xl border border-ink-200 bg-surface-elevated text-sm">
          <div className="grid gap-px bg-ink-200 md:grid-cols-[1.6fr_1fr_1fr]">
            <div className="hidden bg-surface-elevated px-6 py-4 text-xs font-medium tracking-wider text-ink-500 uppercase md:block">
              {t('compare_col_topic')}
            </div>
            <div className="hidden bg-surface-elevated px-6 py-4 text-xs font-medium tracking-wider text-ink-500 uppercase md:block">
              {t('compare_col_old')}
            </div>
            <div className="hidden bg-brand-50/60 px-6 py-4 text-xs font-medium tracking-wider text-brand-700 uppercase md:block">
              {t('compare_col_lume')}
            </div>

            {rows.map((row) => (
              <div key={row} className="md:contents">
                <div className="bg-surface-elevated px-4 py-4 font-medium text-ink-900 sm:px-6">
                  {t(`compare_row_${row}_topic` as 'compare_row_a_topic')}
                </div>
                <div className="bg-surface-elevated px-4 py-4 text-ink-500 sm:px-6">
                  <span className="mb-1 block text-[10px] font-medium tracking-wider text-ink-400 uppercase md:hidden">
                    {t('compare_col_old')}
                  </span>
                  {t(`compare_row_${row}_old` as 'compare_row_a_old')}
                </div>
                <div className="bg-brand-50/40 px-4 py-4 text-ink-900 sm:px-6">
                  <span className="mb-1 block text-[10px] font-medium tracking-wider text-brand-700 uppercase md:hidden">
                    {t('compare_col_lume')}
                  </span>
                  <span className="inline-flex items-start gap-2">
                    <span aria-hidden className="mt-0.5 text-brand-600">
                      ✓
                    </span>
                    {t(`compare_row_${row}_lume` as 'compare_row_a_lume')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
