import { useTranslations } from 'next-intl';
import { SparkIcon } from '@/components/dashboard/Icons';

type ComingSoonProps = {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description: React.ReactNode;
  bullets?: React.ReactNode[];
  eta?: React.ReactNode;
};

export const ComingSoon = (props: ComingSoonProps) => {
  const t = useTranslations('ComingSoon');

  return (
    <div className="relative overflow-hidden rounded-2xl border border-ink-200 bg-surface-elevated">
      <div className="pointer-events-none absolute -top-24 right-[-100px] -z-0 h-72 w-72 rounded-full bg-brand-100/60 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-100px] left-[-80px] -z-0 h-64 w-64 rounded-full bg-accent-50 blur-3xl" />

      <div className="relative z-10 grid gap-6 px-8 py-12 sm:px-12 sm:py-16 md:grid-cols-[auto_1fr] md:items-center md:gap-12">
        <div className="inline-flex size-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-200/70">
          {props.icon ?? <SparkIcon size={28} />}
        </div>

        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-[10px] font-semibold tracking-widest text-brand-700 uppercase">
            <span className="size-1.5 rounded-full bg-brand-500" />
            {t('badge')}
          </span>

          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl">
            {props.title}
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-600">{props.description}</p>

          {props.bullets && props.bullets.length > 0 ? (
            <ul className="mt-6 space-y-2 text-sm text-ink-700">
              {props.bullets.map((bullet, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span
                    aria-hidden
                    className="mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[10px] font-bold text-brand-700"
                  >
                    ✓
                  </span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          ) : null}

          {props.eta ? <p className="mt-6 text-xs text-ink-500">{props.eta}</p> : null}
        </div>
      </div>
    </div>
  );
};
