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

export const PatientHeader = (props: PatientHeaderProps) => {
  const t = useTranslations('PatientHeader');

  return (
    <div className="flex flex-wrap items-start justify-between gap-6 border-b border-ink-200/70 pb-6">
      <div className="flex min-w-0 items-start gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-100 text-base font-semibold text-brand-700 ring-1 ring-brand-200/70">
          {initials(props.fullName) || '·'}
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl">
            {props.fullName}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-500">
            {props.birthDate ? (
              <span className="inline-flex items-center gap-1">
                <span className="text-ink-400">{t('field_birth')}</span>
                <span className="font-medium text-ink-700">{props.birthDate}</span>
              </span>
            ) : null}
            {props.cid ? (
              <span className="inline-flex items-center gap-1">
                <span className="text-ink-400">{t('field_cid')}</span>
                <span className="font-medium text-ink-700">{props.cid}</span>
              </span>
            ) : null}
            {props.diagnosis ? (
              <span className="inline-flex items-center gap-1">
                <span className="text-ink-400">{t('field_diagnosis')}</span>
                <span className="font-medium text-ink-700">{props.diagnosis}</span>
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
