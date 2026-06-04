import { auth } from '@clerk/nextjs/server';
import { and, desc, eq } from 'drizzle-orm';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { FileIcon, PlusIcon } from '@/components/dashboard/Icons';
import { buttonClasses } from '@/components/ui/Button';
import { db } from '@/libs/DB';
import { Link } from '@/libs/I18nNavigation';
import { patientSchema, reportSchema } from '@/models/Schema';

type ReportsPageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function PatientReportsListPage(props: ReportsPageProps) {
  const { locale, id } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'PatientReportsList' });

  const { userId } = await auth();
  if (!userId) {
    notFound();
  }

  const [patient] = await db
    .select({ id: patientSchema.id })
    .from(patientSchema)
    .where(and(eq(patientSchema.id, id), eq(patientSchema.ownerId, userId)))
    .limit(1);

  if (!patient) {
    notFound();
  }

  const reports = await db
    .select({
      id: reportSchema.id,
      periodStart: reportSchema.periodStart,
      periodEnd: reportSchema.periodEnd,
      createdAt: reportSchema.createdAt,
    })
    .from(reportSchema)
    .where(eq(reportSchema.patientId, id))
    .orderBy(desc(reportSchema.createdAt));

  const fmt = (d: string) =>
    new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short', year: 'numeric' }).format(
      new Date(`${d}T12:00:00`),
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-ink-900">{t('title')}</h2>
          <p className="text-sm text-ink-500">{t('description')}</p>
        </div>
        <Link
          href={`/dashboard/patients/${id}/reports/new/`}
          className={buttonClasses('primary', '', 'sm')}
        >
          <PlusIcon size={14} />
          {t('new_report')}
        </Link>
      </div>

      {reports.length === 0 ? (
        <EmptyState
          icon={<FileIcon />}
          title={t('empty_title')}
          description={t('empty_description')}
          action={
            <Link
              href={`/dashboard/patients/${id}/reports/new/`}
              className={buttonClasses('primary', '', 'sm')}
            >
              <PlusIcon size={14} />
              {t('new_report')}
            </Link>
          }
        />
      ) : (
        <ul className="space-y-3">
          {reports.map((r) => (
            <li key={r.id}>
              <Link
                href={`/dashboard/patients/${id}/reports/${r.id}/`}
                className="flex items-center justify-between rounded-xl border border-ink-200 bg-surface-elevated p-5 transition hover:border-ink-300 hover:shadow-sm"
              >
                <div>
                  <div className="text-sm font-semibold text-ink-900">
                    {fmt(r.periodStart)} — {fmt(r.periodEnd)}
                  </div>
                  <div className="mt-0.5 text-xs text-ink-500">
                    {t('created_at', { date: r.createdAt.toLocaleDateString(locale) })}
                  </div>
                </div>
                <span className="text-ink-400">→</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
