'use client';

import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/brand/Logo';
import {
  HomeIcon,
  NotesIcon,
  PatientsIcon,
  ReportsIcon,
  ScheduleIcon,
  SettingsIcon,
} from '@/components/dashboard/Icons';
import { Link } from '@/libs/I18nNavigation';

const navItems = [
  { href: '/dashboard/', key: 'home', Icon: HomeIcon, exact: true },
  { href: '/dashboard/patients/', key: 'patients', Icon: PatientsIcon, exact: false },
  {
    href: '/dashboard/schedule/',
    key: 'schedule',
    Icon: ScheduleIcon,
    exact: false,
  },
  {
    href: '/dashboard/notes/',
    key: 'notes',
    Icon: NotesIcon,
    exact: false,
  },
  {
    href: '/dashboard/reports/',
    key: 'reports',
    Icon: ReportsIcon,
    exact: false,
  },
] as const;

const isActive = (pathname: string, href: string, exact: boolean) => {
  // next-intl strips the locale prefix from usePathname() when prefixing is "as-needed".
  const normalized = pathname.replace(/\/$/, '');
  const target = href.replace(/\/$/, '');
  if (exact) {
    return normalized === target;
  }
  return normalized === target || normalized.startsWith(`${target}/`);
};

export const SidebarNav = () => {
  const pathname = usePathname();
  const t = useTranslations('DashboardNav');

  return (
    <div className="flex h-full flex-col">
      <div className="px-5 py-5">
        <Link href="/dashboard/" className="-m-1 inline-flex p-1" aria-label="Lume">
          <Logo size="md" />
        </Link>
      </div>

      <nav className="flex-1 px-3 py-2">
        <p className="px-3 pb-2 text-[10px] font-semibold tracking-widest text-ink-400 uppercase">
          {t('section_workspace')}
        </p>
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const active = isActive(pathname, item.href, item.exact);
            return (
              <li key={item.key}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition ${
                    active
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900'
                  }`}
                >
                  <item.Icon className={active ? 'text-brand-600' : 'text-ink-400'} size={18} />
                  <span className="flex-1">{t(`item_${item.key}` as 'item_home')}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <p className="mt-6 px-3 pb-2 text-[10px] font-semibold tracking-widest text-ink-400 uppercase">
          {t('section_account')}
        </p>
        <ul className="space-y-0.5">
          <li>
            <Link
              href="/dashboard/settings/"
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition ${
                isActive(pathname, '/dashboard/settings/', false)
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900'
              }`}
            >
              <SettingsIcon size={18} className="text-ink-400" />
              <span>{t('item_settings')}</span>
            </Link>
          </li>
        </ul>
      </nav>

      <div className="border-t border-ink-200 px-5 py-4">
        <p className="text-xs text-ink-500">{t('upgrade_tagline')}</p>
        <Link
          href="/#pricing"
          className="mt-3 inline-flex w-full items-center justify-center rounded-md bg-brand-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-brand-600"
        >
          {t('upgrade_cta')}
        </Link>
      </div>
    </div>
  );
};
