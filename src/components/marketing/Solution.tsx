import { useTranslations } from 'next-intl';

type Item = { key: 'a' | 'b' | 'c'; icon: React.ReactNode; hasBadge?: boolean };

const items: Item[] = [
  {
    key: 'a',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="M8 8h8M8 12h8M8 16h5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    key: 'b',
    hasBadge: true,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="9" y="3" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="M5 11a7 7 0 0 0 14 0M12 18v3"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    key: 'c',
    hasBadge: true,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M4 6h16M4 12h10M4 18h16"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <circle cx="18" cy="12" r="2.4" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    ),
  },
];

export const Solution = () => {
  const t = useTranslations('Landing');

  return (
    <section className="border-b border-ink-200/60 bg-ink-50">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <p className="text-xs font-medium tracking-wider text-brand-700 uppercase">
          {t('solution_eyebrow')}
        </p>
        <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
          {t('solution_title')}
        </h2>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {items.map((item) => (
            <article
              key={item.key}
              className="group relative flex flex-col rounded-xl border border-ink-200 bg-surface-elevated p-7 transition hover:border-brand-300 hover:shadow-sm"
            >
              <div className="inline-flex size-11 items-center justify-center rounded-lg bg-brand-50 text-brand-600 ring-1 ring-brand-200/70">
                {item.icon}
              </div>
              <div className="mt-5 flex items-center gap-2">
                <h3 className="text-lg font-semibold text-ink-900">
                  {t(`solution_${item.key}_title` as 'solution_a_title')}
                </h3>
                {item.hasBadge ? (
                  <span className="rounded-full bg-accent-50 px-2 py-0.5 text-[10px] font-medium tracking-wider text-accent-700 uppercase">
                    {t(`solution_${item.key}_badge` as 'solution_b_badge')}
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">
                {t(`solution_${item.key}_body` as 'solution_a_body')}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
