import { useTranslations } from 'next-intl';

const items = ['a', 'b', 'c', 'd', 'e', 'f'] as const;

export const Faq = () => {
  const t = useTranslations('Landing');

  return (
    <section id="faq" className="border-b border-ink-200/60 bg-ink-50">
      <div className="mx-auto max-w-3xl px-6 py-20">
        <div className="text-center">
          <p className="text-xs font-medium tracking-wider text-brand-700 uppercase">
            {t('faq_eyebrow')}
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
            {t('faq_title')}
          </h2>
        </div>

        <div className="mt-10 divide-y divide-ink-200 overflow-hidden rounded-xl border border-ink-200 bg-surface-elevated">
          {items.map((key) => (
            <details
              key={key}
              className="group px-6 py-4 [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-medium text-ink-900">
                {t(`faq_${key}_q` as 'faq_a_q')}
                <span
                  aria-hidden
                  className="inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-ink-200 text-sm text-ink-500 transition group-open:rotate-45 group-open:border-brand-300 group-open:text-brand-600"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-ink-600">
                {t(`faq_${key}_a` as 'faq_a_a')}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
};
