import { useTranslations } from 'next-intl';

type PatientHeaderProps = {
  fullName: string;
  diagnosis?: string | null;
  birthDate?: string | null;
  cid?: string | null;
};

const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

const Chip = (props: { label: string; value: string }) => (
  <span className="inline-flex items-center gap-1.5 rounded-full border border-ink-200/80 bg-surface-elevated/70 px-2.5 py-1 text-xs backdrop-blur">
    <span className="text-ink-400">{props.label}</span>
    <span className="font-semibold text-ink-700">{props.value}</span>
  </span>
);

export const PatientHeader = (props: PatientHeaderProps) => {
  const t = useTranslations('PatientHeader');

  return (
    <div className="relative overflow-hidden rounded-2xl border border-ink-200 bg-surface-elevated">
      {/* Warm "lume" wash so the patient cover feels alive, not a flat slab. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 100% at 0% 0%, rgba(247,188,116,0.22), transparent 55%), radial-gradient(90% 80% at 100% 0%, rgba(13,148,136,0.06), transparent 60%)',
        }}
      />

      <div className="relative flex items-center gap-4 p-5">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 text-lg font-semibold text-white shadow-sm ring-1 shadow-brand-500/25 ring-brand-300/40">
          {initials(props.fullName) || '·'}
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold tracking-tight text-ink-900 sm:text-2xl">
            {props.fullName}
          </h1>
          {props.birthDate || props.cid ? (
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              {props.birthDate ? <Chip label={t('field_birth')} value={props.birthDate} /> : null}
              {props.cid ? <Chip label={t('field_cid')} value={props.cid} /> : null}
            </div>
          ) : null}
        </div>
      </div>

      {props.diagnosis ? (
        <div className="relative flex items-baseline gap-2 border-t border-ink-200/70 bg-ink-50/50 px-5 py-3">
          <span className="editorial-label shrink-0 text-ink-400">{t('field_diagnosis')}</span>
          <span className="min-w-0 text-sm text-ink-700">{props.diagnosis}</span>
        </div>
      ) : null}
    </div>
  );
};
