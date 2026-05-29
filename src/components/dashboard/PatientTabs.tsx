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
    <div className="-mx-2">
      <nav className="flex snap-x [scrollbar-width:none] gap-2 overflow-x-auto [mask-image:linear-gradient(to_right,black_calc(100%-28px),transparent)] px-4 pt-1 pb-1 [-webkit-mask-image:linear-gradient(to_right,black_calc(100%-28px),transparent)] sm:[mask-image:none] sm:px-0 sm:[-webkit-mask-image:none] [&::-webkit-scrollbar]:hidden">
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
              className={`shrink-0 snap-start rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition ${
                active
                  ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/25'
                  : 'bg-surface-elevated text-ink-600 ring-1 ring-ink-200 hover:text-ink-900 hover:ring-ink-300'
              }`}
            >
              {t(`tab_${tab.key}` as 'tab_overview')}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
