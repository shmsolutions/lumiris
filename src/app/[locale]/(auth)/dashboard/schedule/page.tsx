import { auth } from '@clerk/nextjs/server';
import { and, asc, eq, gte } from 'drizzle-orm';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { ClockIcon, PlusIcon, ScheduleIcon } from '@/components/dashboard/Icons';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { TopBar } from '@/components/dashboard/TopBar';
import { buttonClasses } from '@/components/ui/Button';
import { db } from '@/libs/DB';
import { Link } from '@/libs/I18nNavigation';
import { appointmentSchema, patientSchema } from '@/models/Schema';

type SchedulePageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata(props: SchedulePageProps): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: 'SchedulePage' });
  return { title: t('meta_title') };
}

type AppointmentRow = {
  id: string;
  patientId: string;
  patientName: string;
  startsAt: Date;
  durationMinutes: number;
  status: string;
  notes: string | null;
};

const dayKey = (date: Date) => {
  const yyyy = date.getFullYear();
  const mm = `${date.getMonth() + 1}`.padStart(2, '0');
  const dd = `${date.getDate()}`.padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const groupByDay = (rows: AppointmentRow[]) => {
  const groups = new Map<string, AppointmentRow[]>();
  for (const row of rows) {
    const key = dayKey(row.startsAt);
    const bucket = groups.get(key) ?? [];
    bucket.push(row);
    groups.set(key, bucket);
  }
  return [...groups.entries()];
};

const formatDayLabel = (key: string, locale: string, todayKey: string, tomorrowKey: string) => {
  if (key === todayKey) {
    return { primary: 'today', secondary: null };
  }
  if (key === tomorrowKey) {
    return { primary: 'tomorrow', secondary: null };
  }
  const date = new Date(`${key}T12:00:00`);
  const weekday = new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(date);
  const dayMonth = new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'long',
  }).format(date);
  return {
    primary: weekday.charAt(0).toUpperCase() + weekday.slice(1),
    secondary: dayMonth,
  };
};

const statusTone = (status: string) => {
  if (status === 'completed') {
    return 'bg-accent-50 text-accent-700';
  }
  if (status === 'cancelled') {
    return 'bg-ink-100 text-ink-500 line-through';
  }
  return 'bg-brand-50 text-brand-700';
};

export default async function SchedulePage(props: SchedulePageProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'SchedulePage' });
  const tStatus = await getTranslations({ locale, namespace: 'AppointmentForm' });
  const tNav = await getTranslations({ locale, namespace: 'DashboardNav' });

  const { userId } = await auth();

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const appointments: AppointmentRow[] = userId
    ? await db
        .select({
          id: appointmentSchema.id,
          patientId: appointmentSchema.patientId,
          patientName: patientSchema.fullName,
          startsAt: appointmentSchema.startsAt,
          durationMinutes: appointmentSchema.durationMinutes,
          status: appointmentSchema.status,
          notes: appointmentSchema.notes,
        })
        .from(appointmentSchema)
        .innerJoin(patientSchema, eq(patientSchema.id, appointmentSchema.patientId))
        .where(
          and(eq(appointmentSchema.ownerId, userId), gte(appointmentSchema.startsAt, startOfToday)),
        )
        .orderBy(asc(appointmentSchema.startsAt))
    : [];

  const tomorrow = new Date(startOfToday);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const todayKey = dayKey(startOfToday);
  const tomorrowKey = dayKey(tomorrow);

  const groups = groupByDay(appointments);

  return (
    <>
      <TopBar
        breadcrumb={tNav('section_workspace')}
        title={t('title')}
        actions={
          <Link href="/dashboard/schedule/new/" className={buttonClasses('primary', '', 'sm')}>
            <PlusIcon size={14} />
            <span className="hidden sm:inline">{t('new_appointment')}</span>
          </Link>
        }
      />

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        <PageHeader
          title={t('title')}
          description={t('description')}
          actions={
            <Link href="/dashboard/schedule/new/" className={buttonClasses('primary', '', 'sm')}>
              <PlusIcon size={14} />
              {t('new_appointment')}
            </Link>
          }
        />

        <div className="mt-8">
          {groups.length === 0 ? (
            <EmptyState
              icon={<ScheduleIcon />}
              title={t('empty_title')}
              description={t('empty_description')}
              action={
                <Link
                  href="/dashboard/schedule/new/"
                  className={buttonClasses('primary', '', 'sm')}
                >
                  <PlusIcon size={14} />
                  {t('new_appointment')}
                </Link>
              }
            />
          ) : (
            <ol className="space-y-8">
              {groups.map(([key, list]) => {
                const label = formatDayLabel(key, locale, todayKey, tomorrowKey);
                const primaryLabel =
                  label.primary === 'today'
                    ? t('label_today')
                    : (label.primary === 'tomorrow'
                      ? t('label_tomorrow')
                      : label.primary);

                return (
                  <li key={key}>
                    <div className="mb-3 flex items-baseline gap-3">
                      <h2 className="text-sm font-semibold tracking-wider text-ink-900 uppercase">
                        {primaryLabel}
                      </h2>
                      {label.secondary ? (
                        <span className="text-xs text-ink-500">{label.secondary}</span>
                      ) : null}
                    </div>

                    <ul className="space-y-2">
                      {list.map((appt) => {
                        const timeLabel = new Intl.DateTimeFormat(locale, {
                          hour: '2-digit',
                          minute: '2-digit',
                        }).format(appt.startsAt);

                        const endTime = new Date(
                          appt.startsAt.getTime() + appt.durationMinutes * 60_000,
                        );
                        const endLabel = new Intl.DateTimeFormat(locale, {
                          hour: '2-digit',
                          minute: '2-digit',
                        }).format(endTime);

                        const statusKey = `status_${appt.status}` as 'status_scheduled';

                        return (
                          <li key={appt.id}>
                            <Link
                              href={`/dashboard/schedule/${appt.id}/`}
                              className="flex items-center gap-4 rounded-xl border border-ink-200 bg-surface-elevated p-4 transition hover:border-ink-300 hover:shadow-sm"
                            >
                              <div className="flex flex-col items-center">
                                <span className="font-mono text-base font-semibold text-ink-900">
                                  {timeLabel}
                                </span>
                                <span className="font-mono text-[10px] text-ink-400">
                                  → {endLabel}
                                </span>
                              </div>
                              <span className="hidden h-10 w-px bg-ink-200 sm:block" />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="truncate text-sm font-semibold text-ink-900">
                                    {appt.patientName}
                                  </span>
                                  <span
                                    className={`rounded-full px-2 py-0.5 text-[9px] font-semibold tracking-wider uppercase ${statusTone(appt.status)}`}
                                  >
                                    {tStatus(statusKey)}
                                  </span>
                                </div>
                                {appt.notes ? (
                                  <p className="mt-0.5 truncate text-xs text-ink-500">
                                    {appt.notes}
                                  </p>
                                ) : (
                                  <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-ink-400">
                                    <ClockIcon size={12} />
                                    {appt.durationMinutes} min
                                  </p>
                                )}
                              </div>
                              <span className="shrink-0 text-ink-400">→</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </div>
    </>
  );
}
