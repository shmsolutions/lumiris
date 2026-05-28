import { useTranslations } from 'next-intl';
import { Link } from '@/libs/I18nNavigation';

type PlanKey = 'free' | 'student' | 'pro';

type Plan = {
  key: PlanKey;
  price: string;
  period?: string;
  featured?: boolean;
  features: number;
};

const plans: Plan[] = [
  { key: 'free', price: 'R$ 0', features: 4 },
  {
    key: 'student',
    price: 'R$ 19',
    period: 'período_month',
    features: 6,
  },
  {
    key: 'pro',
    price: 'R$ 89',
    period: 'período_month',
    featured: true,
    features: 7,
  },
];

export const Pricing = () => {
  const t = useTranslations('Landing');

  return (
    <section id="pricing" className="scroll-mt-20 border-b border-ink-200/60 bg-surface">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium tracking-wider text-brand-700 uppercase">
            {t('pricing_eyebrow')}
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
            {t('pricing_title')}
          </h2>
          <p className="mt-3 text-base text-ink-600">{t('pricing_subtitle')}</p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => {
            const features = Array.from({ length: plan.features }, (_, i) => i);
            const isFeatured = plan.featured;

            return (
              <article
                key={plan.key}
                className={`relative flex flex-col rounded-2xl border bg-surface-elevated p-8 ${
                  isFeatured ? 'border-brand-300 shadow-xl shadow-brand-900/5' : 'border-ink-200'
                }`}
              >
                {isFeatured ? (
                  <span className="absolute -top-3 right-6 inline-flex items-center rounded-full bg-brand-500 px-3 py-1 text-[10px] font-semibold tracking-wider text-white uppercase">
                    {t('pricing_featured_badge')}
                  </span>
                ) : null}

                <div>
                  <h3 className="text-sm font-semibold tracking-wider text-ink-500 uppercase">
                    {t(`pricing_${plan.key}_name` as 'pricing_free_name')}
                  </h3>
                  <p className="mt-3 text-sm text-ink-600">
                    {t(`pricing_${plan.key}_tagline` as 'pricing_free_tagline')}
                  </p>
                </div>

                <div className="mt-6 flex items-end gap-1">
                  <span className="text-4xl font-semibold tracking-tight text-ink-900">
                    {plan.price}
                  </span>
                  {plan.period ? (
                    <span className="mb-1 text-sm text-ink-500">{t('pricing_period_month')}</span>
                  ) : (
                    <span className="mb-1 text-sm text-ink-500">{t('pricing_period_free')}</span>
                  )}
                </div>

                <ul className="mt-6 space-y-3 text-sm text-ink-700">
                  {features.map((i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span
                        aria-hidden
                        className="mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[10px] font-bold text-brand-700"
                      >
                        ✓
                      </span>
                      <span>
                        {t(`pricing_${plan.key}_feature_${i}` as 'pricing_free_feature_0')}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto pt-8">
                  {plan.key === 'free' ? (
                    <Link
                      href="/sign-up/"
                      className={`inline-flex w-full items-center justify-center rounded-md px-4 py-2.5 text-sm font-semibold shadow-sm transition ${
                        isFeatured
                          ? 'bg-brand-500 text-white hover:bg-brand-600'
                          : 'border border-ink-200 bg-surface-elevated text-ink-800 hover:border-ink-300'
                      }`}
                    >
                      {t(`pricing_${plan.key}_cta` as 'pricing_free_cta')}
                    </Link>
                  ) : (
                    <a
                      href={`/api/billing/checkout?plan=${plan.key}`}
                      className={`inline-flex w-full items-center justify-center rounded-md px-4 py-2.5 text-sm font-semibold shadow-sm transition ${
                        isFeatured
                          ? 'bg-brand-500 text-white hover:bg-brand-600'
                          : 'border border-ink-200 bg-surface-elevated text-ink-800 hover:border-ink-300'
                      }`}
                    >
                      {t(`pricing_${plan.key}_cta` as 'pricing_free_cta')}
                    </a>
                  )}
                  <p className="mt-3 text-xs text-ink-500">
                    {t(`pricing_${plan.key}_note` as 'pricing_free_note')}
                  </p>
                </div>
              </article>
            );
          })}
        </div>

        <p className="mt-10 text-center text-sm text-ink-500">
          {t.rich('pricing_clinic_line', {
            link: (chunks) => (
              <a
                href="mailto:oi@lumiris.com.br"
                className="font-medium text-brand-700 underline-offset-4 hover:underline"
              >
                {chunks}
              </a>
            ),
          })}
        </p>
      </div>
    </section>
  );
};
