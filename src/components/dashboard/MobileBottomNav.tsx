'use client';

import { SignOutButton } from '@clerk/nextjs';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  CloseIcon,
  FileIcon,
  HomeIcon,
  MenuIcon,
  NotesIcon,
  PatientsIcon,
  ReportsIcon,
  ScheduleIcon,
  SettingsIcon,
  StarIcon,
} from '@/components/dashboard/Icons';
import { Link } from '@/libs/I18nNavigation';
import type { PlanId } from '@/utils/Plans';

type NavItem = {
  href: string;
  key: 'home' | 'patients' | 'notes';
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  exact?: boolean;
};

const tabs: NavItem[] = [
  { href: '/dashboard/', key: 'home', Icon: HomeIcon, exact: true },
  { href: '/dashboard/patients/', key: 'patients', Icon: PatientsIcon },
  { href: '/dashboard/notes/', key: 'notes', Icon: NotesIcon },
];

const isActive = (pathname: string, href: string, exact?: boolean) => {
  const normalized = pathname.replace(/\/$/, '');
  const target = href.replace(/\/$/, '');
  if (exact) {
    return normalized === target;
  }
  return normalized === target || normalized.startsWith(`${target}/`);
};

/**
 * Bottom navigation visible only on small screens. Reaches the thumb easily,
 * matches native iOS/Android conventions for primary-destination switching.
 */
type MobileBottomNavProps = {
  plan: PlanId;
};

export const MobileBottomNav = (props: MobileBottomNavProps) => {
  const t = useTranslations('DashboardNav');
  const tBilling = useTranslations('BillingPage');
  const pathname = usePathname();
  const [sheetOpen, setSheetOpen] = useState(false);
  const isPaid = props.plan !== 'free';

  // Close sheet on route change.
  useEffect(() => {
    setSheetOpen(false);
  }, [pathname]);

  // Lock body scroll and close on Escape while the sheet is open.
  useEffect(() => {
    if (!sheetOpen) {
      return;
    }
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSheetOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
    };
  }, [sheetOpen]);

  // "Mais" is active when none of the primary tabs are active.
  const noneActive = !tabs.some((tab) => isActive(pathname, tab.href, tab.exact));
  const moreActive =
    noneActive ||
    isActive(pathname, '/dashboard/reports/', false) ||
    isActive(pathname, '/dashboard/schedule/', false) ||
    isActive(pathname, '/dashboard/settings/', false);

  return (
    <>
      <nav
        aria-label={t('section_workspace')}
        className="fixed inset-x-0 bottom-0 z-30 border-t border-ink-200 bg-surface/95 backdrop-blur lg:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <ul className="mx-auto grid max-w-md grid-cols-4">
          {tabs.map((tab) => {
            const active = isActive(pathname, tab.href, tab.exact);
            return (
              <li key={tab.key}>
                <Link
                  href={tab.href}
                  aria-current={active ? 'page' : undefined}
                  className={`flex flex-col items-center justify-center gap-1 px-2 py-2.5 text-[11px] font-medium transition ${
                    active ? 'text-brand-700' : 'text-ink-500'
                  }`}
                >
                  <span
                    className={`inline-flex size-9 items-center justify-center rounded-lg transition ${
                      active ? 'bg-brand-50 text-brand-600' : 'text-ink-400'
                    }`}
                  >
                    <tab.Icon size={20} />
                  </span>
                  <span>{t(`item_${tab.key}` as 'item_home')}</span>
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => {
                setSheetOpen(true);
              }}
              className={`flex w-full flex-col items-center justify-center gap-1 px-2 py-2.5 text-[11px] font-medium transition ${
                moreActive ? 'text-brand-700' : 'text-ink-500'
              }`}
            >
              <span
                className={`inline-flex size-9 items-center justify-center rounded-lg transition ${
                  moreActive ? 'bg-brand-50 text-brand-600' : 'text-ink-400'
                }`}
              >
                <MenuIcon size={20} />
              </span>
              <span>{t('item_more')}</span>
            </button>
          </li>
        </ul>
      </nav>

      {sheetOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label={t('close_menu')}
            onClick={() => {
              setSheetOpen(false);
            }}
            className="absolute inset-0 bg-ink-900/50 backdrop-blur-sm"
          />
          <div
            className="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-2xl border border-ink-200 bg-surface-elevated shadow-2xl"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-ink-200" />

            <div className="flex items-center justify-between px-5 py-4">
              <h2 className="text-base font-semibold text-ink-900">{t('item_more')}</h2>
              <button
                type="button"
                onClick={() => {
                  setSheetOpen(false);
                }}
                className="inline-flex size-11 items-center justify-center rounded-md text-ink-500 transition hover:bg-ink-100 hover:text-ink-900"
                aria-label={t('close')}
              >
                <CloseIcon size={18} />
              </button>
            </div>

            <div className="px-3 pb-4">
              <p className="px-3 pb-2 text-[10px] font-semibold tracking-widest text-ink-400 uppercase">
                {t('section_workspace')}
              </p>
              <ul className="space-y-0.5">
                <SheetItem
                  href="/dashboard/schedule/"
                  label={t('item_schedule')}
                  Icon={ScheduleIcon}
                  pathname={pathname}
                />
                <SheetItem
                  href="/dashboard/reports/"
                  label={t('item_reports')}
                  Icon={ReportsIcon}
                  pathname={pathname}
                />
                <SheetItem
                  href="/dashboard/modelos/"
                  label={t('item_modelos')}
                  Icon={FileIcon}
                  pathname={pathname}
                />
              </ul>

              <p className="mt-5 px-3 pb-2 text-[10px] font-semibold tracking-widest text-ink-400 uppercase">
                {t('section_account')}
              </p>
              <ul className="space-y-0.5">
                <SheetItem
                  href="/dashboard/settings/"
                  label={t('item_settings')}
                  Icon={SettingsIcon}
                  pathname={pathname}
                />
              </ul>

              <div className="mt-5 px-3">
                {isPaid ? (
                  <Link
                    href="/dashboard/settings/?tab=plano"
                    className="flex items-center gap-3 rounded-md bg-brand-50 px-3 py-3 text-sm transition hover:bg-brand-100"
                  >
                    <span className="inline-flex size-8 items-center justify-center rounded-md bg-brand-500 text-white">
                      <StarIcon size={14} />
                    </span>
                    <span className="flex-1">
                      <span className="block font-semibold text-brand-800">
                        {tBilling(`plan_${props.plan}_name` as 'plan_student_name')}
                      </span>
                      <span className="block text-xs text-brand-700/70">{t('plan_manage')}</span>
                    </span>
                  </Link>
                ) : (
                  <Link
                    href="/dashboard/settings/?tab=plano"
                    className="inline-flex w-full items-center justify-center rounded-md bg-brand-500 px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-brand-600"
                  >
                    {t('upgrade_cta')}
                  </Link>
                )}
              </div>

              <div className="mt-3 px-3">
                <SignOutButton>
                  <button
                    type="button"
                    className="inline-flex w-full items-center justify-center rounded-md border border-ink-200 bg-surface-elevated px-4 py-2.5 text-sm font-semibold text-ink-700 transition hover:border-ink-300"
                  >
                    {t('sign_out')}
                  </button>
                </SignOutButton>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

type SheetItemProps = {
  href: string;
  label: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  pathname: string;
};

const SheetItem = (props: SheetItemProps) => {
  const active = isActive(props.pathname, props.href);
  return (
    <li>
      <Link
        href={props.href}
        aria-current={active ? 'page' : undefined}
        className={`flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium transition ${
          active ? 'bg-brand-50 text-brand-700' : 'text-ink-700 hover:bg-ink-100'
        }`}
      >
        <props.Icon size={20} className={active ? 'text-brand-600' : 'text-ink-400'} />
        <span className="flex-1">{props.label}</span>
      </Link>
    </li>
  );
};
