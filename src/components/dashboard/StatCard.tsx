type Tone = 'neutral' | 'brand' | 'accent' | 'warning';

type StatCardProps = {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: React.ReactNode;
  tone?: Tone;
};

const toneText: Record<Tone, string> = {
  neutral: 'text-ink-300',
  brand: 'text-brand-400',
  accent: 'text-accent-500',
  warning: 'text-brand-400',
};

export const StatCard = (props: StatCardProps) => {
  const iconColor = toneText[props.tone ?? 'neutral'];

  return (
    <div className="rounded-xl border border-ink-200 bg-surface-elevated p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="editorial-label text-ink-500">{props.label}</p>
        {props.icon ? <span className={iconColor}>{props.icon}</span> : null}
      </div>
      <div className="font-display mt-4 text-4xl leading-none text-ink-900">{props.value}</div>
      {props.hint ? <p className="mt-2 text-xs text-ink-500">{props.hint}</p> : null}
    </div>
  );
};
