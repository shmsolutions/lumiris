'use client';

import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { Link } from '@/libs/I18nNavigation';

type PatientTabsProps = {
  patientId: string;
};

type Tab = { key: string; segment: string; comingSoon?: boolean };

const tabs: Tab[] = [
  { key: 'overview', segment: '' },
  { key: 'anamnesis', segment: 'anamnesis' },
  { key: 'plan', segment: 'plan' },
  { key: 'notes', segment: 'notes' },
  { key: 'reports', segment: 'reports' },
  { key: 'attachments', segment: 'attachments' },
  { key: 'edit', segment: 'edit' },
];

export const PatientTabs = (props: PatientTabsProps) => {
  const t = useTranslations('PatientTabs');
  const pathname = usePathname();

  return (
    <nav className="-mb-px flex gap-1 overflow-x-auto border-b border-ink-200">
      {tabs.map((tab) => {
        const base = `/dashboard/patients/${props.patientId}`;
        const href = tab.segment ? `${base}/${tab.segment}/` : `${base}/`;
        const normalized = pathname.replace(/\/$/, '');
        const target = href.replace(/\/$/, '');
        const active = tab.segment ? normalized === target : normalized === target;

        return (
          <Link
            key={tab.key}
            href={href}
            className={`relative inline-flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium whitespace-nowrap transition ${
              active
                ? 'border-brand-500 text-brand-700'
                : 'border-transparent text-ink-500 hover:border-ink-300 hover:text-ink-800'
            }`}
          >
            {t(`tab_${tab.key}` as 'tab_overview')}
            {tab.comingSoon ? (
              <span className="rounded-full bg-ink-100 px-1.5 py-0.5 text-[9px] font-semibold tracking-wider text-ink-500 uppercase">
                {t('badge_soon')}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
};
