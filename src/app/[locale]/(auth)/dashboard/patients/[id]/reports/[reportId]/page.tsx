import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { ArrowRightIcon, FileIcon, SparkIcon } from '@/components/dashboard/Icons';
import { ReportDetail } from '@/components/reports/ReportDetail';
import { buttonClasses } from '@/components/ui/Button';
import { db } from '@/libs/DB';
import { getEntitlements } from '@/libs/Entitlements';
import { Link } from '@/libs/I18nNavigation';
import { reportSchema } from '@/models/Schema';
import { ReportContentValidation } from '@/validations/ReportValidation';

type ReportDetailPageProps = {
  params: Promise<{ locale: string; id: string; reportId: string }>;
};

export default async function ReportDetailPage(props: ReportDetailPageProps) {
  const { locale, id, reportId } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'ReportDetailPage' });

  const { userId } = await auth();
  if (!userId) {
    notFound();
  }

  const { limits } = await getEntitlements(userId);
  const canExportPdf = limits.pdf.report;

  const [report] = await db
    .select()
    .from(reportSchema)
    .where(
      and(
        eq(reportSchema.id, reportId),
        eq(reportSchema.patientId, id),
        eq(reportSchema.ownerId, userId),
      ),
    )
    .limit(1);

  if (!report) {
    notFound();
  }

  const content = ReportContentValidation.parse(report.content);

  const fmt = (d: string) =>
    new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'long', year: 'numeric' }).format(
      new Date(`${d}T12:00:00`),
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link
            href={`/dashboard/patients/${id}/reports/`}
            className="text-xs text-brand-700 transition hover:text-brand-800"
          >
            ← {t('back')}
          </Link>
          <h2 className="mt-1 text-lg font-semibold text-ink-900">{t('title')}</h2>
          <p className="text-sm text-ink-500">
            {fmt(report.periodStart)} — {fmt(report.periodEnd)}
          </p>
        </div>
        {canExportPdf ? (
          <div className="flex items-center gap-2">
            <a
              href={`/api/patients/${id}/reports/${report.id}/pdf?locale=${locale}`}
              target="_blank"
              rel="noreferrer"
              className={buttonClasses('secondary', '', 'sm')}
            >
              <FileIcon size={14} />
              {t('export_pdf')}
            </a>
            <a
              href={`/api/patients/${id}/reports/${report.id}/pdf?locale=${locale}&format=docx`}
              target="_blank"
              rel="noreferrer"
              className={buttonClasses('secondary', '', 'sm')}
            >
              <FileIcon size={14} />
              {t('export_docx')}
            </a>
          </div>
        ) : (
          <Link
            href="/dashboard/settings/?tab=plano"
            className="inline-flex items-center gap-1.5 rounded-md border border-brand-200 bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700 transition hover:bg-brand-100"
            title={t('export_locked_hint')}
          >
            <SparkIcon size={14} />
            {t('export_locked')}
            <ArrowRightIcon size={13} />
          </Link>
        )}
      </div>

      <ReportDetail patientId={id} reportId={report.id} initialContent={content} />
    </div>
  );
}
