import { useTranslations } from 'next-intl';

const items = ['a', 'b', 'c', 'd', 'e', 'f'] as const;

export const Faq = () => {
  const t = useTranslations('Landing');

  return (
    <section id="faq" className="scroll-mt-28 border-b border-ink-200/60 bg-surface">
      <div className="mx-auto max-w-3xl px-6 py-20 sm:py-28">
        <div className="flex items-center justify-between border-b border-ink-200 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="font-display text-xl leading-none text-brand-700">§</span>
            <span className="editorial-label text-ink-700">{t('chart_notas')}</span>
          </div>
          <span className="font-mono text-[11px] text-ink-500 tabular-nums">
            {t('chart_folio')} 11
          </span>
        </div>
        <h2 className="font-display mt-8 text-4xl leading-[1.08] text-balance text-ink-900 sm:text-5xl">
          {t('faq_title')}
        </h2>

        <div className="mt-10 border-t border-ink-200">
          {items.map((key, index) => (
            <details
              key={key}
              className="group border-b border-ink-200 py-5 [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer list-none items-start gap-4 text-base font-medium text-ink-900">
                <span className="pt-0.5 font-mono text-xs text-brand-700 tabular-nums">
                  {`0${index + 1}`}
                </span>
                <span className="flex-1">{t(`faq_${key}_q` as 'faq_a_q')}</span>
                <span
                  aria-hidden
                  className="text-lg leading-none text-ink-500 transition group-open:rotate-45 group-open:text-brand-600"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 pl-8 text-sm leading-relaxed text-ink-600">
                {t(`faq_${key}_a` as 'faq_a_a')}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
};
