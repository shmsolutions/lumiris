import { useTranslations } from 'next-intl';

/**
 * Static, decorative mockup of the Lume dashboard. Pure HTML/CSS — no real data.
 * Designed to give visual proof of the product without requiring screenshots.
 */
export const ProductPreview = () => {
  const t = useTranslations('Landing');

  return (
    <section className="border-b border-ink-200/60 bg-surface">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium tracking-wider text-brand-700 uppercase">
            {t('preview_eyebrow')}
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
            {t('preview_title')}
          </h2>
          <p className="mt-3 text-base text-ink-600">{t('preview_subtitle')}</p>
        </div>

        <div className="relative mt-14">
          <div className="pointer-events-none absolute -inset-x-10 -top-12 bottom-[-40px] -z-10 rounded-[40px] bg-gradient-to-br from-brand-100/70 via-surface to-accent-50 blur-2xl" />

          <div className="overflow-hidden rounded-2xl border border-ink-200 bg-surface-elevated shadow-xl shadow-ink-900/5">
            <div className="flex items-center gap-2 border-b border-ink-200 bg-ink-50 px-4 py-3">
              <span className="size-2.5 rounded-full bg-ink-300" />
              <span className="size-2.5 rounded-full bg-ink-300" />
              <span className="size-2.5 rounded-full bg-ink-300" />
              <span className="ml-4 rounded-md bg-surface-elevated px-3 py-1 text-xs text-ink-500">
                app.lume.com.br/dashboard/patients
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[220px_1fr]">
              <aside className="hidden border-r border-ink-200 bg-ink-50/50 p-5 md:block">
                <div className="flex items-center gap-2 text-sm font-semibold text-ink-800">
                  <span className="inline-block size-2 rounded-full bg-brand-500" />
                  lume
                </div>
                <nav className="mt-6 space-y-1 text-sm">
                  <span className="block rounded-md px-3 py-2 text-ink-600">
                    {t('preview_nav_home')}
                  </span>
                  <span className="block rounded-md bg-brand-50 px-3 py-2 font-medium text-brand-700">
                    {t('preview_nav_patients')}
                  </span>
                  <span className="block rounded-md px-3 py-2 text-ink-600">
                    {t('preview_nav_schedule')}
                  </span>
                  <span className="block rounded-md px-3 py-2 text-ink-600">
                    {t('preview_nav_reports')}
                  </span>
                </nav>
              </aside>

              <div className="p-6 sm:p-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-ink-900">
                    {t('preview_section_title')}
                  </h3>
                  <span className="inline-flex items-center gap-1 rounded-md bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm">
                    {t('preview_new_button')}
                    <span aria-hidden>+</span>
                  </span>
                </div>

                <div className="mt-6 overflow-hidden rounded-lg border border-ink-200">
                  {[
                    { key: 'a', reportDue: false },
                    { key: 'b', reportDue: true },
                    { key: 'c', reportDue: false },
                  ].map((row, i) => (
                    <div
                      key={row.key}
                      className={`flex items-center justify-between px-4 py-3 text-sm ${
                        i > 0 ? 'border-t border-ink-200' : ''
                      }`}
                    >
                      <div>
                        <div className="font-medium text-ink-900">
                          {t(`preview_row_${row.key}_name` as 'preview_row_a_name')}
                        </div>
                        <div className="mt-0.5 text-xs text-ink-500">
                          {t(`preview_row_${row.key}_diag` as 'preview_row_a_diag')}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {row.reportDue ? (
                          <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-medium tracking-wider text-brand-700 uppercase">
                            {t('preview_tag_report_due')}
                          </span>
                        ) : (
                          <span className="rounded-full bg-accent-50 px-2 py-0.5 text-[10px] font-medium tracking-wider text-accent-700 uppercase">
                            {t('preview_tag_active')}
                          </span>
                        )}
                        <span className="text-xs text-ink-400">
                          {t(`preview_row_${row.key}_date` as 'preview_row_a_date')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border border-ink-200 p-4">
                    <div className="text-xs font-medium tracking-wider text-ink-500 uppercase">
                      {t('preview_card_next_session')}
                    </div>
                    <div className="mt-2 text-sm font-semibold text-ink-900">
                      {t('preview_card_next_session_value')}
                    </div>
                    <div className="mt-1 text-xs text-ink-500">
                      {t('preview_card_next_session_patient')}
                    </div>
                  </div>
                  <div className="rounded-lg border border-brand-200 bg-brand-50/60 p-4">
                    <div className="text-xs font-medium tracking-wider text-brand-700 uppercase">
                      {t('preview_card_alert')}
                    </div>
                    <div className="mt-2 text-sm font-semibold text-ink-900">
                      {t('preview_card_alert_value')}
                    </div>
                    <div className="mt-1 text-xs text-ink-500">
                      {t('preview_card_alert_patient')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
