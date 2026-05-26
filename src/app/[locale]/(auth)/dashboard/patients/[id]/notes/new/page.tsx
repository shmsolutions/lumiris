import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { NoteComposer } from '@/components/notes/NoteComposer';
import { db } from '@/libs/DB';
import { Link } from '@/libs/I18nNavigation';
import { appointmentSchema, patientSchema, treatmentPlanSchema } from '@/models/Schema';
import { TreatmentPlanUpsertValidation } from '@/validations/TreatmentPlanValidation';

type NewNotePageProps = {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ appointment?: string }>;
};

export default async function NewNotePage(props: NewNotePageProps) {
  const { locale, id } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'NewNotePage' });
  const tForm = await getTranslations({ locale, namespace: 'NoteComposer' });
  const searchParams = await props.searchParams;

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

  // Fetch active objectives from the treatment plan to offer as checklist.
  const [planRow] = await db
    .select({ objectives: treatmentPlanSchema.objectives })
    .from(treatmentPlanSchema)
    .where(eq(treatmentPlanSchema.patientId, id))
    .limit(1);
  const allObjectives = TreatmentPlanUpsertValidation.shape.objectives.parse(
    planRow?.objectives ?? [],
  );
  const activeObjectives = allObjectives
    .filter((o) => o.status === 'active')
    .map(({ id: oid, title }) => ({ id: oid, title }));

  // Verify the appointment belongs to this user (don't blindly trust the URL).
  let appointmentId: string | undefined;
  let appointmentLabel: string | null = null;
  if (searchParams.appointment) {
    const [appt] = await db
      .select({
        id: appointmentSchema.id,
        startsAt: appointmentSchema.startsAt,
      })
      .from(appointmentSchema)
      .where(
        and(
          eq(appointmentSchema.id, searchParams.appointment),
          eq(appointmentSchema.ownerId, userId),
          eq(appointmentSchema.patientId, id),
        ),
      )
      .limit(1);

    if (appt) {
      appointmentId = appt.id;
      appointmentLabel = new Intl.DateTimeFormat(locale, {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit',
      }).format(appt.startsAt);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link
            href={`/dashboard/patients/${id}/notes/`}
            className="text-xs text-brand-700 transition hover:text-brand-800"
          >
            ← {t('back')}
          </Link>
          <h2 className="mt-1 text-lg font-semibold text-ink-900">{t('title')}</h2>
          <p className="text-sm text-ink-500">{t('description')}</p>
        </div>
      </div>

      {appointmentLabel ? (
        <div className="rounded-lg border border-accent-500/30 bg-accent-50 px-4 py-3 text-sm text-accent-700">
          {tForm('appointment_linked_banner', { appointment: appointmentLabel })}
        </div>
      ) : null}

      <NoteComposer patientId={id} appointmentId={appointmentId} objectives={activeObjectives} />
    </div>
  );
}
