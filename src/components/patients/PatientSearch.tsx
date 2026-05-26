'use client';

import { useTranslations } from 'next-intl';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { SearchIcon } from '@/components/dashboard/Icons';

/**
 * Debounced search input that syncs `?q=` to the URL and lets the server
 * re-render the filtered list.
 */
export const PatientSearch = () => {
  const t = useTranslations('PatientsPage');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initial = searchParams.get('q') ?? '';
  const [value, setValue] = useState(initial);

  useEffect(() => {
    const handle = setTimeout(() => {
      const current = searchParams.get('q') ?? '';
      if (value === current) {
        return;
      }
      const params = new URLSearchParams(searchParams.toString());
      if (value.trim()) {
        params.set('q', value.trim());
      } else {
        params.delete('q');
      }
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }, 300);
    return () => {
      clearTimeout(handle);
    };
  }, [value, pathname, router, searchParams]);

  return (
    <div className="relative">
      <input
        type="search"
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
        }}
        placeholder={t('search_placeholder')}
        className="w-full rounded-md border border-ink-200 bg-surface-elevated py-2 pr-3 pl-9 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-200 focus:outline-none sm:w-64"
      />
      <SearchIcon
        size={16}
        className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-400"
      />
    </div>
  );
};
