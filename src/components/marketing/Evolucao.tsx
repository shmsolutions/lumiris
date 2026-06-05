import { useTranslations } from 'next-intl';
import { ChartChapter } from '@/components/marketing/ChartChapter';
import { ClinicalDocument } from '@/components/marketing/ClinicalDocument';

const flows = ['a', 'b', 'c'] as const;
const steps = ['a', 'b', 'c'] as const;

/** § 02 — the plan of care: the capabilities, the artifact, the procedure. */
export const Evolucao = () => {
  const t = useTranslations('Landing');

  return (
    <ChartChapter
      id="evolucao"
      num="02"
      label={t('nav_evolucao')}
      folio="03"
      title={t('solution_title')}
      marginNote={t('margin_evolucao')}
      tone="alt"
    >
      <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
        <dl className="border-t border-ink-200">
          {flows.map((flow, index) => (
            <div key={flow} className="border-b border-ink-200 py-6">
              <dt className="grid grid-cols-[2rem_1fr] gap-x-4 text-base font-semibold text-ink-900">
                <span className="font-mono text-xs text-brand-600 tabular-nums">{`0${index + 1}`}</span>
                <span>{t(`solution_${flow}_title` as 'solution_a_title')}</span>
              </dt>
              <dd className="mt-2 pl-12 text-sm leading-relaxed text-ink-600">
                {t(`solution_${flow}_body` as 'solution_a_body')}
              </dd>
            </div>
          ))}
        </dl>

        <figure className="lg:sticky lg:top-28">
          <ClinicalDocument />
          <figcaption className="mt-5 flex items-center gap-2 text-ink-500">
            <span className="font-mono text-[11px] tracking-tight text-ink-500">Fig. 02</span>
            <span className="editorial-label">{t('hero_figure_caption')}</span>
          </figcaption>
        </figure>
      </div>

      <div className="mt-16">
        <div className="editorial-label flex items-center gap-3 text-ink-500">
          {t('how_eyebrow')}
          <span className="h-px flex-1 bg-ink-200" />
        </div>
        <ol className="mt-8 grid gap-10 sm:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step} className="border-t border-ink-200 pt-5">
              <span className="font-display text-3xl leading-none text-brand-600">
                {`0${index + 1}`}
              </span>
              <h3 className="mt-3 text-base font-semibold text-ink-900">
                {t(`how_step_${step}_title` as 'how_step_a_title')}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">
                {t(`how_step_${step}_body` as 'how_step_a_body')}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </ChartChapter>
  );
};
