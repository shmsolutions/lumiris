import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { PatientForm } from '@/components/patients/PatientForm';
import { db } from '@/libs/DB';
import { Link } from '@/libs/I18nNavigation';
import { patientSchema } from '@/models/Schema';

type EditPatientPageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export async function generateMetadata(props: EditPatientPageProps): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: 'EditPatientPage' });
  return { title: t('meta_title') };
}

export default async function EditPatientPage(props: EditPatientPageProps) {
  const { locale, id } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'EditPatientPage' });

  const { userId } = await auth();
  if (!userId) {
    notFound();
  }

  const [patient] = await db
    .select()
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
          href={`/dashboard/patients/${id}/`}
          className="text-xs text-brand-700 transition hover:text-brand-800"
        >
          ← {t('back')}
        </Link>
        <h2 className="mt-1 text-lg font-semibold text-ink-900">{t('title')}</h2>
        <p className="text-sm text-ink-500">{t('description')}</p>
      </div>

      <PatientForm
        mode="edit"
        patientId={patient.id}
        initialValues={{
          fullName: patient.fullName,
          birthDate: patient.birthDate ?? '',
          guardianName: patient.guardianName ?? '',
          guardianRelation: patient.guardianRelation ?? '',
          contactPhone: patient.contactPhone ?? '',
          contactEmail: patient.contactEmail ?? '',
          naturality: patient.naturality ?? '',
          maritalStatus: patient.maritalStatus ?? '',
          gender: patient.gender ?? '',
          profession: patient.profession ?? '',
          residentialAddress: patient.residentialAddress ?? '',
          commercialAddress: patient.commercialAddress ?? '',
          diagnosis: patient.diagnosis ?? '',
          cid: patient.cid ?? '',
          mainComplaint: patient.mainComplaint ?? '',
          school: patient.school ?? '',
          otherProfessionals: patient.otherProfessionals ?? '',
          notes: patient.notes ?? '',
        }}
      />
    </div>
  );
}
