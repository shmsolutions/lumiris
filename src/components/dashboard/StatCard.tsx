type Tone = 'neutral' | 'brand' | 'accent' | 'warning';

type StatCardProps = {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: React.ReactNode;
  tone?: Tone;
};

const toneClasses: Record<Tone, { bg: string; ring: string; text: string }> = {
  neutral: { bg: 'bg-ink-100', ring: 'ring-ink-200', text: 'text-ink-600' },
  brand: { bg: 'bg-brand-50', ring: 'ring-brand-200/70', text: 'text-brand-700' },
  accent: { bg: 'bg-accent-50', ring: 'ring-accent-500/30', text: 'text-accent-700' },
  warning: { bg: 'bg-brand-50', ring: 'ring-brand-200', text: 'text-brand-700' },
};

export const StatCard = (props: StatCardProps) => {
  const tone = toneClasses[props.tone ?? 'neutral'];

  return (
    <div className="rounded-xl border border-ink-200 bg-surface-elevated p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium tracking-wider text-ink-500 uppercase">{props.label}</p>
        {props.icon ? (
          <span
            className={`inline-flex size-9 items-center justify-center rounded-lg ring-1 ${tone.bg} ${tone.ring} ${tone.text}`}
          >
            {props.icon}
          </span>
        ) : null}
      </div>
      <div className="mt-3 text-3xl font-semibold tracking-tight text-ink-900">{props.value}</div>
      {props.hint ? <p className="mt-1 text-xs text-ink-500">{props.hint}</p> : null}
    </div>
  );
};
