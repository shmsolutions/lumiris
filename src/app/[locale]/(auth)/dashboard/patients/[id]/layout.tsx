import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { PatientHeader } from '@/components/dashboard/PatientHeader';
import { PatientTabs } from '@/components/dashboard/PatientTabs';
import { TopBar } from '@/components/dashboard/TopBar';
import { db } from '@/libs/DB';
import { Link } from '@/libs/I18nNavigation';
import { patientSchema } from '@/models/Schema';

type PatientLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string; id: string }>;
};

export default async function PatientLayout(props: PatientLayoutProps) {
  const { locale, id } = await props.params;
  setRequestLocale(locale);
  const tList = await getTranslations({ locale, namespace: 'PatientsPage' });

  const { userId } = await auth();
  if (!userId) {
    notFound();
  }

  const [patient] = await db
    .select({
      id: patientSchema.id,
      fullName: patientSchema.fullName,
      diagnosis: patientSchema.diagnosis,
      birthDate: patientSchema.birthDate,
      cid: patientSchema.cid,
    })
    .from(patientSchema)
    .where(and(eq(patientSchema.id, id), eq(patientSchema.ownerId, userId)))
    .limit(1);

  if (!patient) {
    notFound();
  }

  const birthDateLabel = patient.birthDate
    ? new Intl.DateTimeFormat(locale, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(new Date(`${patient.birthDate}T12:00:00`))
    : null;

  return (
    <>
      <TopBar
        breadcrumb={
          <Link
            href="/dashboard/patients/"
            className="inline-flex items-center gap-1 font-medium transition hover:text-ink-900"
          >
            ← {tList('title')}
          </Link>
        }
      />
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        <PatientHeader
          fullName={patient.fullName}
          diagnosis={patient.diagnosis}
          birthDate={birthDateLabel}
          cid={patient.cid}
        />
        <div className="mt-5">
          <PatientTabs patientId={patient.id} />
        </div>
        <div className="mt-6">{props.children}</div>
      </div>
    </>
  );
}
