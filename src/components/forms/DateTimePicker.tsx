'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { ptBR } from 'react-day-picker/locale';
import { ClockIcon, ScheduleIcon } from '@/components/dashboard/Icons';
import { buttonClasses } from '@/components/ui/Button';

type DateTimePickerProps = {
  /** Value in `yyyy-MM-ddTHH:mm` format (datetime-local compatible). */
  value: string;
  onChange: (value: string) => void;
  /** Optional id for the trigger button (label `htmlFor`). */
  id?: string;
  disabled?: boolean;
};

const pad = (n: number) => `${n}`.padStart(2, '0');

const toLocalValue = (date: Date, time: string) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${time}`;

const parseValue = (value: string) => {
  if (!value) {
    const now = new Date();
    now.setHours(now.getHours() + 1, 0, 0, 0);
    return { date: now, time: `${pad(now.getHours())}:${pad(now.getMinutes())}` };
  }
  const [datePart, timePart = '09:00'] = value.split('T');
  if (!datePart) {
    return { date: new Date(), time: timePart };
  }
  const [yyyy, mm, dd] = datePart.split('-').map(Number);
  const date = new Date(yyyy ?? 1970, (mm ?? 1) - 1, dd ?? 1);
  return { date, time: timePart.slice(0, 5) };
};

const formatTrigger = (value: string, locale: string) => {
  if (!value) {
    return null;
  }
  const { date, time } = parseValue(value);
  const dateLabel = new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
  return { dateLabel, time };
};

export const DateTimePicker = (props: DateTimePickerProps) => {
  const locale = useLocale();
  const tCommon = useTranslations('Common');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { date: parsedDate, time: parsedTime } = parseValue(props.value);

  useEffect(() => {
    if (!open) {
      return;
    }
    const handler = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handleDaySelect = (date: Date | undefined) => {
    if (!date) {
      return;
    }
    props.onChange(toLocalValue(date, parsedTime));
  };

  const handleTimeChange = (time: string) => {
    props.onChange(toLocalValue(parsedDate, time));
  };

  const trigger = formatTrigger(props.value, locale);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        id={props.id}
        disabled={props.disabled}
        onClick={() => {
          setOpen((prev) => !prev);
        }}
        className={`mt-1.5 flex w-full items-center gap-3 rounded-md border bg-surface-elevated px-3 py-2 text-left text-sm text-ink-900 transition focus:ring-2 focus:ring-brand-200 focus:outline-none disabled:opacity-50 ${
          open ? 'border-brand-400 ring-2 ring-brand-200' : 'border-ink-200 hover:border-ink-300'
        }`}
      >
        <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-600">
          <ScheduleIcon size={16} />
        </span>
        {trigger ? (
          <span className="flex-1 truncate">
            <span className="font-medium text-ink-900 capitalize">{trigger.dateLabel}</span>
            <span className="ml-2 inline-flex items-center gap-1 text-ink-500">
              <ClockIcon size={12} />
              <span className="font-mono">{trigger.time}</span>
            </span>
          </span>
        ) : (
          <span className="text-ink-400">—</span>
        )}
        <span aria-hidden className="text-ink-400">
          {open ? '▴' : '▾'}
        </span>
      </button>

      {open ? (
        <div
          className="absolute top-full left-0 z-30 mt-2 w-fit max-w-[calc(100vw-2rem)] min-w-[19rem] rounded-xl border border-ink-200 bg-surface-elevated shadow-xl"
          role="dialog"
          aria-modal
          aria-label={tCommon('calendar')}
        >
          <div className="p-2">
            <DayPicker
              mode="single"
              selected={parsedDate}
              onSelect={handleDaySelect}
              locale={locale === 'pt-BR' ? ptBR : undefined}
              showOutsideDays
            />
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-ink-200 px-4 py-3">
            <label className="flex items-center gap-2 text-xs font-medium text-ink-600">
              <ClockIcon size={14} className="text-ink-400" />
              <input
                type="time"
                value={parsedTime}
                onChange={(event) => {
                  handleTimeChange(event.target.value);
                }}
                className="rounded-md border border-ink-200 bg-surface-elevated px-2 py-1 font-mono text-sm text-ink-900 focus:border-brand-400 focus:ring-2 focus:ring-brand-200 focus:outline-none"
              />
            </label>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
              }}
              className={buttonClasses('primary', '', 'sm')}
            >
              {tCommon('done')}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};
