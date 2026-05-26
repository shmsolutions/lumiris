import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { PlanForm } from '@/components/plan/PlanForm';
import { db } from '@/libs/DB';
import { patientSchema, treatmentPlanSchema } from '@/models/Schema';
import { TreatmentPlanUpsertValidation } from '@/validations/TreatmentPlanValidation';

type PlanPageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function PlanPage(props: PlanPageProps) {
  const { locale, id } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'PatientPlanPage' });

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

  const [plan] = await db
    .select()
    .from(treatmentPlanSchema)
    .where(eq(treatmentPlanSchema.patientId, id))
    .limit(1);

  const initialValues = TreatmentPlanUpsertValidation.parse({
    frequency: plan?.frequency ?? '',
    procedures: plan?.procedures ?? '',
    notes: plan?.notes ?? '',
    objectives: plan?.objectives ?? [],
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-ink-900">{t('title')}</h2>
        <p className="text-sm text-ink-500">{t('description')}</p>
      </div>

      <PlanForm patientId={patient.id} initialValues={initialValues} />
    </div>
  );
}
