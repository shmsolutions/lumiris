import { auth } from '@clerk/nextjs/server';
import { desc, eq } from 'drizzle-orm';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { FileIcon, PatientsIcon } from '@/components/dashboard/Icons';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { TopBar } from '@/components/dashboard/TopBar';
import { db } from '@/libs/DB';
import { Link } from '@/libs/I18nNavigation';
import { patientSchema, reportSchema } from '@/models/Schema';

type ReportsPageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata(props: ReportsPageProps): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: 'ReportsPage' });
  return { title: t('meta_title') };
}

export default async function ReportsPage(props: ReportsPageProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'ReportsPage' });
  const tNav = await getTranslations({ locale, namespace: 'DashboardNav' });

  const { userId } = await auth();

  const reports = userId
    ? await db
        .select({
          id: reportSchema.id,
          patientId: reportSchema.patientId,
          patientName: patientSchema.fullName,
          periodStart: reportSchema.periodStart,
          periodEnd: reportSchema.periodEnd,
          createdAt: reportSchema.createdAt,
        })
        .from(reportSchema)
        .innerJoin(patientSchema, eq(patientSchema.id, reportSchema.patientId))
        .where(eq(reportSchema.ownerId, userId))
        .orderBy(desc(reportSchema.createdAt))
        .limit(50)
    : [];

  const fmt = (d: string) =>
    new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short', year: 'numeric' }).format(
      new Date(`${d}T12:00:00`),
    );

  return (
    <>
      <TopBar breadcrumb={tNav('section_workspace')} title={t('title')} />
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <PageHeader title={t('title')} description={t('description')} />

        <div className="mt-8">
          {reports.length === 0 ? (
            <EmptyState
              icon={<FileIcon />}
              title={t('empty_title')}
              description={t('empty_description')}
              action={
                <Link
                  href="/dashboard/patients/"
                  className="inline-flex items-center gap-2 rounded-md bg-brand-500 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-600"
                >
                  <PatientsIcon size={14} />
                  {t('cta_go_patients')}
                </Link>
              }
            />
          ) : (
            <ul className="space-y-3">
              {reports.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/dashboard/patients/${r.patientId}/reports/${r.id}/`}
                    className="flex items-center justify-between rounded-xl border border-ink-200 bg-surface-elevated p-5 transition hover:border-ink-300 hover:shadow-sm"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-ink-900">
                        {r.patientName}
                      </div>
                      <div className="mt-0.5 text-xs text-ink-500">
                        {fmt(r.periodStart)} — {fmt(r.periodEnd)}
                      </div>
                    </div>
                    <span className="shrink-0 text-ink-400">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
