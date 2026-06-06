import { useTranslations } from 'next-intl';
import { ChartChapter } from '@/components/marketing/ChartChapter';
import { buttonClasses, CtaArrow } from '@/components/ui/Button';
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
  { key: 'free', price: 'R$ 0', features: 5 },
  {
    key: 'student',
    price: 'R$ 9',
    period: 'período_month',
    features: 6,
  },
  {
    key: 'pro',
    price: 'R$ 29',
    period: 'período_month',
    featured: true,
    features: 7,
  },
];

export const Pricing = () => {
  const t = useTranslations('Landing');

  return (
    <ChartChapter
      id="plano"
      num="04"
      label={t('nav_plano')}
      folio="08"
      layout="banner"
      tone="alt"
      title={t('pricing_title')}
      subtitle={t('pricing_subtitle')}
    >
      <div className="grid border-t border-ink-200 lg:grid-cols-3 lg:divide-x lg:divide-ink-200">
        {plans.map((plan) => {
          const features = Array.from({ length: plan.features }, (_, i) => i);
          const isFeatured = plan.featured;

          return (
            <div
              key={plan.key}
              className={`flex flex-col border-b border-ink-200 py-8 lg:border-b-0 lg:px-8 lg:first:pl-0 lg:last:pr-0 ${
                isFeatured ? 'lg:bg-brand-50/30' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="editorial-label text-ink-700">
                  {t(`pricing_${plan.key}_name` as 'pricing_free_name')}
                </h3>
                {isFeatured ? (
                  <span className="editorial-label text-brand-700">
                    {t('pricing_featured_badge')}
                  </span>
                ) : null}
              </div>

              <div className="mt-5 flex items-end gap-1.5">
                <span className="font-display text-5xl leading-none text-ink-900">
                  {plan.price}
                </span>
                <span className="mb-1 text-sm text-ink-500">
                  {plan.period ? t('pricing_period_month') : t('pricing_period_free')}
                </span>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-ink-600">
                {t(`pricing_${plan.key}_tagline` as 'pricing_free_tagline')}
              </p>

              <ul className="mt-7 space-y-2.5 text-sm text-ink-700">
                {features.map((i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-brand-400" />
                    <span>{t(`pricing_${plan.key}_feature_${i}` as 'pricing_free_feature_0')}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-8">
                {plan.key === 'free' ? (
                  <Link
                    href="/sign-up/"
                    className={buttonClasses(isFeatured ? 'primary' : 'secondary', 'w-full')}
                  >
                    {t(`pricing_${plan.key}_cta` as 'pricing_free_cta')}
                    <CtaArrow />
                  </Link>
                ) : (
                  <a
                    href={`/api/billing/checkout?plan=${plan.key}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonClasses(isFeatured ? 'primary' : 'secondary', 'w-full')}
                  >
                    {t(`pricing_${plan.key}_cta` as 'pricing_free_cta')}
                    <CtaArrow />
                  </a>
                )}
                <p className="mt-3 text-xs text-ink-500">
                  {t(`pricing_${plan.key}_note` as 'pricing_free_note')}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-10 text-center text-sm text-ink-500">
        {t.rich('pricing_clinic_line', {
          // oxlint-disable-next-line react/no-unstable-nested-components
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
    </ChartChapter>
  );
};
