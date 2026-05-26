import { useTranslations } from 'next-intl';

const steps = ['a', 'b', 'c'] as const;

export const HowItWorks = () => {
  const t = useTranslations('Landing');

  return (
    <section id="how-it-works" className="border-b border-ink-200/60 bg-surface">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <p className="text-xs font-medium tracking-wider text-brand-700 uppercase">
          {t('how_eyebrow')}
        </p>
        <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
          {t('how_title')}
        </h2>

        <ol className="mt-12 grid gap-8 sm:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step} className="relative">
              <div className="flex items-center gap-3">
                <span className="inline-flex size-9 items-center justify-center rounded-full border border-brand-300 bg-brand-50 text-sm font-semibold text-brand-700">
                  {index + 1}
                </span>
                <span className="text-xs font-medium tracking-wider text-ink-500 uppercase">
                  {t(`how_step_${step}_label` as 'how_step_a_label')}
                </span>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-ink-900">
                {t(`how_step_${step}_title` as 'how_step_a_title')}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">
                {t(`how_step_${step}_body` as 'how_step_a_body')}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
};
