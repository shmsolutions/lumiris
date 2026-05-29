import { auth, currentUser } from '@clerk/nextjs/server';
import { and, asc, count, desc, eq, gte, isNull, lt } from 'drizzle-orm';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { EmptyState } from '@/components/dashboard/EmptyState';
import {
  AlertIcon,
  ArrowRightIcon,
  ClockIcon,
  NotesIcon,
  PatientsIcon,
  PlusIcon,
  ReportsIcon,
  ScheduleIcon,
} from '@/components/dashboard/Icons';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { StatCard } from '@/components/dashboard/StatCard';
import { TopBar } from '@/components/dashboard/TopBar';
import { db } from '@/libs/DB';
import { Link } from '@/libs/I18nNavigation';
import { getPendingReports } from '@/libs/Reports';
import { getUserProfile } from '@/libs/UserProfile';
import { anamnesisSchema, appointmentSchema, patientSchema } from '@/models/Schema';

type DashboardPageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata(props: DashboardPageProps): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: 'DashboardLayout' });
  return { title: t('meta_title') };
}

export default async function DashboardPage(props: DashboardPageProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Dashboard' });
  const tNav = await getTranslations({ locale, namespace: 'DashboardNav' });

  const { userId } = await auth();

  // Greeting name priority: the professional name the user set in Settings,
  // then Clerk's first name, then the email prefix. The profile name is what
  // they explicitly chose, so it wins.
  const profile = userId ? await getUserProfile(userId) : null;
  const profileFirstName = profile?.therapistName?.trim().split(/\s+/)[0] ?? '';

  // currentUser() hits the Clerk Backend API and can fail transiently — don't
  // let a Clerk hiccup crash the whole dashboard.
  let clerkName = '';
  if (!profileFirstName) {
    try {
      const user = await currentUser();
      clerkName = user?.firstName ?? user?.primaryEmailAddress?.emailAddress?.split('@')[0] ?? '';
    } catch {
      clerkName = '';
    }
  }

  const firstName = profileFirstName || clerkName;

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

  const ownerFilter = userId ? eq(patientSchema.ownerId, userId) : undefined;

  const [
    patientsCountRow,
    anamnesisCountRow,
    todayAppointmentsCountRow,
    recentPatients,
    todayAppointments,
  ] = userId
    ? await Promise.all([
        db
          .select({ value: count() })
          .from(patientSchema)
          .where(and(ownerFilter, isNull(patientSchema.archivedAt))),
        db
          .select({ value: count() })
          .from(anamnesisSchema)
          .where(eq(anamnesisSchema.ownerId, userId)),
        db
          .select({ value: count() })
          .from(appointmentSchema)
          .where(
            and(
              eq(appointmentSchema.ownerId, userId),
              gte(appointmentSchema.startsAt, startOfToday),
              lt(appointmentSchema.startsAt, startOfTomorrow),
            ),
          ),
        db
          .select({
            id: patientSchema.id,
            fullName: patientSchema.fullName,
            diagnosis: patientSchema.diagnosis,
            updatedAt: patientSchema.updatedAt,
          })
          .from(patientSchema)
          .where(and(ownerFilter, isNull(patientSchema.archivedAt)))
          .orderBy(desc(patientSchema.updatedAt))
          .limit(5),
        db
          .select({
            id: appointmentSchema.id,
            patientId: appointmentSchema.patientId,
            patientName: patientSchema.fullName,
            startsAt: appointmentSchema.startsAt,
            durationMinutes: appointmentSchema.durationMinutes,
            status: appointmentSchema.status,
          })
          .from(appointmentSchema)
          .innerJoin(patientSchema, eq(patientSchema.id, appointmentSchema.patientId))
          .where(
            and(
              eq(appointmentSchema.ownerId, userId),
              gte(appointmentSchema.startsAt, startOfToday),
              lt(appointmentSchema.startsAt, startOfTomorrow),
            ),
          )
          .orderBy(asc(appointmentSchema.startsAt)),
      ])
    : [[{ value: 0 }], [{ value: 0 }], [{ value: 0 }], [], []];

  const activePatients = patientsCountRow[0]?.value ?? 0;
  const anamnesesFilled = anamnesisCountRow[0]?.value ?? 0;
  const sessionsToday = todayAppointmentsCountRow[0]?.value ?? 0;
  const dateLabel = new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(today);

  const pendingReports = userId ? await getPendingReports(userId) : [];

  return (
    <>
      <TopBar
        breadcrumb={tNav('section_workspace')}
        title={t('topbar_title')}
        actions={
          <Link
            href="/dashboard/patients/new/"
            className="inline-flex items-center gap-1.5 rounded-md bg-brand-500 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-600"
          >
            <PlusIcon size={14} />
            <span className="hidden sm:inline">{t('quick_new_patient')}</span>
          </Link>
        }
      />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <PageHeader
          eyebrow={dateLabel}
          title={t('welcome_title', { name: firstName || t('welcome_fallback') })}
          description={t('welcome_subtitle')}
          actions={
            <Link
              href="/dashboard/patients/"
              className="inline-flex items-center gap-1.5 rounded-md border border-ink-200 bg-surface-elevated px-3 py-2 text-xs font-semibold whitespace-nowrap text-ink-700 transition hover:border-ink-300"
            >
              {t('quick_view_patients')}
              <ArrowRightIcon size={14} />
            </Link>
          }
        />

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label={t('stat_patients_label')}
            value={activePatients}
            hint={t('stat_patients_hint')}
            tone="brand"
            icon={<PatientsIcon size={18} />}
          />
          <StatCard
            label={t('stat_anamneses_label')}
            value={anamnesesFilled}
            hint={t('stat_anamneses_hint')}
            tone="accent"
            icon={<NotesIcon size={18} />}
          />
          <StatCard
            label={t('stat_sessions_label')}
            value={sessionsToday}
            hint={t('stat_sessions_hint')}
            tone="neutral"
            icon={<ScheduleIcon size={18} />}
          />
          <StatCard
            label={t('stat_reports_label')}
            value={pendingReports.length}
            hint={t('stat_reports_hint')}
            tone="warning"
            icon={<ReportsIcon size={18} />}
          />
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-ink-200 bg-surface-elevated">
              <div className="flex items-center justify-between border-b border-ink-200 px-5 py-4">
                <h2 className="text-sm font-semibold tracking-wider text-ink-500 uppercase">
                  {t('schedule_title')}
                </h2>
                <Link
                  href="/dashboard/schedule/"
                  className="text-xs font-semibold text-brand-700 transition hover:text-brand-800"
                >
                  {t('schedule_view_all')} →
                </Link>
              </div>
              {todayAppointments.length === 0 ? (
                <div className="p-5">
                  <EmptyState
                    icon={<ScheduleIcon />}
                    title={t('schedule_empty_title')}
                    description={t('schedule_empty_description')}
                    action={
                      <Link
                        href="/dashboard/schedule/new/"
                        className="inline-flex items-center gap-2 rounded-md bg-brand-500 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-600"
                      >
                        <PlusIcon size={14} />
                        {t('schedule_new')}
                      </Link>
                    }
                  />
                </div>
              ) : (
                <ul className="divide-y divide-ink-200">
                  {todayAppointments.map((appt) => {
                    const timeLabel = new Intl.DateTimeFormat(locale, {
                      hour: '2-digit',
                      minute: '2-digit',
                    }).format(appt.startsAt);
                    return (
                      <li key={appt.id}>
                        <Link
                          href={`/dashboard/schedule/${appt.id}/`}
                          className="flex items-center gap-4 px-5 py-3 transition hover:bg-ink-50"
                        >
                          <span className="font-mono text-sm font-semibold text-ink-900">
                            {timeLabel}
                          </span>
                          <span className="h-6 w-px bg-ink-200" />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium text-ink-900">
                              {appt.patientName}
                            </div>
                            <div className="text-xs text-ink-500">{appt.durationMinutes} min</div>
                          </div>
                          <ArrowRightIcon size={14} className="text-ink-400" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-brand-200/70 bg-brand-50/40 p-5">
            <div className="flex items-start gap-3">
              <span className="inline-flex size-9 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
                <AlertIcon size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-semibold tracking-wider text-brand-700 uppercase">
                  {t('alerts_title')}
                </h2>
                {pendingReports.length === 0 ? (
                  <p className="mt-2 text-sm text-ink-700">{t('alerts_none')}</p>
                ) : (
                  <ul className="mt-3 space-y-1.5">
                    {pendingReports.slice(0, 5).map((p) => (
                      <li key={p.patientId}>
                        <Link
                          href={`/dashboard/patients/${p.patientId}/reports/`}
                          className="flex items-center justify-between gap-2 rounded-lg bg-surface-elevated px-3 py-2 text-sm ring-1 ring-ink-200/60 transition hover:ring-brand-200"
                        >
                          <span className="truncate font-medium text-ink-800">{p.fullName}</span>
                          <span
                            className={`shrink-0 text-xs font-medium ${
                              p.overdue ? 'text-danger' : 'text-brand-700'
                            }`}
                          >
                            {p.overdue
                              ? t('alert_overdue')
                              : (p.daysUntil <= 0
                                ? t('alert_due_today')
                                : t('alert_due_in', { count: p.daysUntil }))}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-wider text-ink-500 uppercase">
              {t('recent_title')}
            </h2>
            <Link
              href="/dashboard/patients/"
              className="text-xs font-semibold text-brand-700 transition hover:text-brand-800"
            >
              {t('recent_view_all')} →
            </Link>
          </div>

          {recentPatients.length === 0 ? (
            <EmptyState
              icon={<PatientsIcon />}
              title={t('recent_empty_title')}
              description={t('recent_empty_description')}
              action={
                <Link
                  href="/dashboard/patients/new/"
                  className="inline-flex items-center gap-2 rounded-md bg-brand-500 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-600"
                >
                  <PlusIcon size={14} />
                  {t('quick_new_patient')}
                </Link>
              }
            />
          ) : (
            <ul className="divide-y divide-ink-200 overflow-hidden rounded-xl border border-ink-200 bg-surface-elevated">
              {recentPatients.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/dashboard/patients/${p.id}/`}
                    className="flex items-center justify-between px-5 py-4 transition hover:bg-ink-50"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-ink-900">
                        {p.fullName}
                      </div>
                      <div className="mt-0.5 truncate text-xs text-ink-500">
                        {p.diagnosis ?? t('recent_no_diagnosis')}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="hidden items-center gap-1 text-xs text-ink-500 sm:inline-flex">
                        <ClockIcon size={12} />
                        {p.updatedAt.toLocaleDateString(locale)}
                      </span>
                      <ArrowRightIcon className="text-ink-400" size={16} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
