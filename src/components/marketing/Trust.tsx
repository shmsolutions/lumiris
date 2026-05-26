import { useTranslations } from 'next-intl';

const items = ['a', 'b', 'c', 'd'] as const;

const icons = {
  a: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden>
      <path
        d="M12 2 4 5v6c0 5 3.5 9.3 8 11 4.5-1.7 8-6 8-11V5l-8-3Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
  b: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden>
      <rect x="4" y="10" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ),
  c: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M4 12h16M12 4a12 12 0 0 1 0 16M12 4a12 12 0 0 0 0 16"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  ),
  d: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden>
      <path
        d="M4 7h16M4 12h16M4 17h10"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  ),
};

export const Trust = () => {
  const t = useTranslations('Landing');

  return (
    <section className="border-b border-ink-200/60 bg-ink-50">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium tracking-wider text-brand-700 uppercase">
            {t('trust_eyebrow')}
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
            {t('trust_title')}
          </h2>
          <p className="mt-3 text-base text-ink-600">{t('trust_subtitle')}</p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((key) => (
            <article key={key} className="rounded-xl border border-ink-200 bg-surface-elevated p-5">
              <div className="inline-flex size-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600 ring-1 ring-brand-200/70">
                {icons[key]}
              </div>
              <h3 className="mt-4 text-sm font-semibold text-ink-900">
                {t(`trust_${key}_title` as 'trust_a_title')}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-ink-600">
                {t(`trust_${key}_body` as 'trust_a_body')}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
