import { useTranslations } from 'next-intl';
import { ChartChapter } from '@/components/marketing/ChartChapter';

const features = ['a', 'b', 'c', 'd', 'e', 'f'] as const;
const rows = ['a', 'b', 'c', 'd', 'e'] as const;
const trust = ['a', 'b', 'c', 'd'] as const;

/** § 03 — the proof: what the record holds, before vs now, why to trust it. */
export const Relatorio = () => {
  const t = useTranslations('Landing');

  return (
    <ChartChapter
      id="relatorio"
      num="03"
      label={t('nav_relatorio')}
      folio="06"
      title={t('features_title')}
      marginNote={t('margin_relatorio')}
    >
      {/* What the chart holds — an index, not cards. */}
      <dl className="grid border-t border-ink-200 sm:grid-cols-2">
        {features.map((key, index) => (
          <div
            key={key}
            className="border-b border-ink-200 py-5 sm:odd:border-r sm:odd:pr-8 sm:even:pl-8"
          >
            <dt className="grid grid-cols-[2rem_1fr] gap-x-3 text-sm font-semibold text-ink-900">
              <span className="font-mono text-xs text-brand-700 tabular-nums">{`0${index + 1}`}</span>
              <span>{t(`features_${key}_title` as 'features_a_title')}</span>
            </dt>
            <dd className="mt-1.5 pl-[2.75rem] text-sm leading-relaxed text-ink-600">
              {t(`features_${key}_body` as 'features_a_body')}
            </dd>
          </div>
        ))}
      </dl>

      {/* Before / now — a list of transformations, not a grid table. */}
      <div className="mt-16">
        <div className="editorial-label flex items-center gap-3 text-ink-500">
          {t('compare_eyebrow')}
          <span className="h-px flex-1 bg-ink-200" />
        </div>
        <ol className="mt-4 border-t border-ink-200">
          {rows.map((row) => (
            <li key={row} className="border-b border-ink-200 py-6">
              <h3 className="font-display text-xl text-ink-900">
                {t(`compare_row_${row}_topic` as 'compare_row_a_topic')}
              </h3>
              <div className="mt-3 grid gap-x-10 gap-y-3 sm:grid-cols-2">
                <p className="text-sm text-ink-500">
                  <span className="editorial-label mr-2 text-ink-500">{t('compare_before')}</span>
                  {t(`compare_row_${row}_old` as 'compare_row_a_old')}
                </p>
                <p className="text-sm text-ink-800">
                  <span className="editorial-label mr-2 text-brand-700">{t('compare_after')}</span>
                  {t(`compare_row_${row}_lume` as 'compare_row_a_lume')}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* Trust — the seal at the foot of the record. */}
      <div className="mt-16">
        <div className="editorial-label flex items-center gap-3 text-ink-500">
          {t('trust_eyebrow')}
          <span className="h-px flex-1 bg-ink-200" />
        </div>
        <dl className="mt-8 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
          {trust.map((key) => (
            <div key={key} className="border-t border-ink-200 pt-4">
              <dt className="text-sm font-semibold text-ink-900">
                {t(`trust_${key}_title` as 'trust_a_title')}
              </dt>
              <dd className="mt-1.5 text-sm leading-relaxed text-ink-600">
                {t(`trust_${key}_body` as 'trust_a_body')}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </ChartChapter>
  );
};
