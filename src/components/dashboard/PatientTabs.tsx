'use client';

import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { Link } from '@/libs/I18nNavigation';

type PatientTabsProps = {
  patientId: string;
};

type Tab = { key: string; segment: string };

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
        const active = normalized === target;

        return (
          <Link
            key={tab.key}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={`inline-flex items-center border-b-2 px-3 py-3 text-sm font-medium whitespace-nowrap transition ${
              active
                ? 'border-brand-500 text-brand-700'
                : 'border-transparent text-ink-500 hover:border-ink-300 hover:text-ink-800'
            }`}
          >
            {t(`tab_${tab.key}` as 'tab_overview')}
          </Link>
        );
      })}
    </nav>
  );
};
