import { useTranslations } from 'next-intl';

const features = ['a', 'b', 'c', 'd', 'e', 'f'] as const;

export const Features = () => {
  const t = useTranslations('Landing');

  return (
    <section className="border-b border-ink-200/60 bg-ink-50">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <p className="text-xs font-medium tracking-wider text-brand-700 uppercase">
          {t('features_eyebrow')}
        </p>
        <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
          {t('features_title')}
        </h2>

        <div className="mt-12 grid gap-px overflow-hidden rounded-xl bg-ink-200/70 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((key) => (
            <article key={key} className="bg-surface-elevated p-6">
              <h3 className="flex items-center gap-2 text-base font-semibold text-ink-900">
                <span className="inline-block size-1.5 rounded-full bg-brand-500" />
                {t(`features_${key}_title` as 'features_a_title')}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">
                {t(`features_${key}_body` as 'features_a_body')}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
