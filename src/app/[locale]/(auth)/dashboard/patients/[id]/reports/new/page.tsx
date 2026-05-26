import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { ReportComposer } from '@/components/reports/ReportComposer';
import { db } from '@/libs/DB';
import { Link } from '@/libs/I18nNavigation';
import { patientSchema } from '@/models/Schema';

type NewReportPageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function NewReportPage(props: NewReportPageProps) {
  const { locale, id } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'NewReportPage' });

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

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/dashboard/patients/${id}/reports/`}
          className="text-xs text-brand-700 transition hover:text-brand-800"
        >
          ← {t('back')}
        </Link>
        <h2 className="mt-1 text-lg font-semibold text-ink-900">{t('title')}</h2>
        <p className="text-sm text-ink-500">{t('description')}</p>
      </div>

      <ReportComposer patientId={id} />
    </div>
  );
}
