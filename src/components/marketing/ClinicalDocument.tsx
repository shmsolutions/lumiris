import { useTranslations } from 'next-intl';
import { SparkIcon } from '@/components/dashboard/Icons';

const fields = ['proc', 'interc', 'evol'] as const;

/**
 * A rendered occupational-therapy progress note — the artifact Lumiris
 * produces. Static, paper-like, signed. Stands in for a screenshot without
 * looking like a generic app UI.
 */
export const ClinicalDocument = () => {
  const t = useTranslations('Landing');

  return (
    <article className="relative rounded-sm border border-ink-200 bg-surface-elevated shadow-xl shadow-ink-900/5">
      {/* Letterhead */}
      <header className="flex items-end justify-between border-b border-ink-300 px-7 pt-6 pb-4">
        <span className="font-display text-xl leading-none text-ink-900">Lumiris</span>
        <span className="editorial-label text-ink-500">{t('nav_evolucao')}</span>
      </header>

      <div className="px-7 pt-5 pb-7">
        <div className="flex items-center justify-between font-mono text-[11px] text-ink-500 tabular-nums">
          <span>{t('preview_row_a_name')}</span>
          <span>{t('doc_date')}</span>
        </div>

        <dl className="mt-6 space-y-5">
          {fields.map((field) => (
            <div key={field} className="border-t border-ink-200 pt-3">
              <dt className="editorial-label text-brand-700">
                {t(`hero_demo_field_${field}` as 'hero_demo_field_proc')}
              </dt>
              <dd className="mt-1.5 text-sm leading-relaxed text-ink-700">
                {t(`hero_demo_text_${field}` as 'hero_demo_text_proc')}
              </dd>
            </div>
          ))}
        </dl>

        {/* Signature */}
        <div className="mt-9 flex flex-col items-end">
          <span className="font-display text-2xl text-ink-700 italic">{t('doc_signature')}</span>
          <span className="mt-1 h-px w-44 bg-ink-300" />
          <span className="mt-2 font-mono text-[11px] text-ink-500">{t('doc_signer')}</span>
        </div>

        <p className="mt-7 flex items-center gap-2 border-t border-ink-200 pt-4 text-[11px] text-ink-500">
          <SparkIcon size={13} />
          {t('doc_note')}
        </p>
      </div>
    </article>
  );
};
