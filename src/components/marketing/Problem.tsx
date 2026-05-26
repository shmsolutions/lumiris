import { useTranslations } from 'next-intl';

const items = [
  { key: 'a', minutes: '2-3h' },
  { key: 'b', minutes: '10/dia' },
  { key: 'c', minutes: 'Word' },
] as const;

export const Problem = () => {
  const t = useTranslations('Landing');

  return (
    <section className="border-b border-ink-200/60 bg-surface">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <p className="text-xs font-medium tracking-wider text-brand-700 uppercase">
          {t('problem_eyebrow')}
        </p>
        <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
          {t('problem_title')}
        </h2>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <article
              key={item.key}
              className="rounded-lg border border-ink-200 bg-surface-elevated p-6"
            >
              <span className="text-2xl font-bold text-brand-600">{item.minutes}</span>
              <h3 className="mt-3 text-base font-semibold text-ink-900">
                {t(`problem_${item.key}_title` as 'problem_a_title')}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">
                {t(`problem_${item.key}_body` as 'problem_a_body')}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
