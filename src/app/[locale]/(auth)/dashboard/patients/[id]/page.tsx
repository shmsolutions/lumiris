import { auth } from '@clerk/nextjs/server';
import { and, count, eq } from 'drizzle-orm';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { db } from '@/libs/DB';
import { Link } from '@/libs/I18nNavigation';
import {
  anamnesisSchema,
  patientSchema,
  sessionNoteSchema,
  treatmentPlanSchema,
} from '@/models/Schema';
import { TreatmentPlanUpsertValidation } from '@/validations/TreatmentPlanValidation';
import type { Objective } from '@/validations/TreatmentPlanValidation';

type PatientOverviewPageProps = {
  params: Promise<{ locale: string; id: string }>;
};

const FieldRow = (props: { label: string; value: React.ReactNode }) => (
  <div className="grid grid-cols-1 gap-0.5 border-b border-ink-200/70 px-5 py-3 last:border-b-0 sm:grid-cols-[140px_1fr] sm:gap-4">
    <div className="text-xs font-medium tracking-wider text-ink-500 uppercase">{props.label}</div>
    <div className="min-w-0 text-sm break-words text-ink-800">{props.value}</div>
  </div>
);

export default async function PatientOverviewPage(props: PatientOverviewPageProps) {
  const { locale, id } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'PatientOverview' });

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

  const [anamnesis] = await db
    .select({ id: anamnesisSchema.id, updatedAt: anamnesisSchema.updatedAt })
    .from(anamnesisSchema)
    .where(eq(anamnesisSchema.patientId, id))
    .limit(1);

  const [notesCountRow] = await db
    .select({ value: count() })
    .from(sessionNoteSchema)
    .where(eq(sessionNoteSchema.patientId, id));
  const notesCount = notesCountRow?.value ?? 0;

  const [planRow] = await db
    .select({ objectives: treatmentPlanSchema.objectives })
    .from(treatmentPlanSchema)
    .where(eq(treatmentPlanSchema.patientId, id))
    .limit(1);
  const planObjectives: Objective[] = TreatmentPlanUpsertValidation.shape.objectives.parse(
    planRow?.objectives ?? [],
  );
  const activeObjectivesCount = planObjectives.filter((o) => o.status === 'active').length;

  const empty = <span className="text-ink-400">—</span>;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <section className="overflow-hidden rounded-xl border border-ink-200 bg-surface-elevated">
          <header className="border-b border-ink-200 px-5 py-3">
            <h2 className="text-xs font-semibold tracking-wider text-ink-500 uppercase">
              {t('section_personal')}
            </h2>
          </header>
          <FieldRow label={t('field_full_name')} value={patient.fullName} />
          <FieldRow label={t('field_birth_date')} value={patient.birthDate ?? empty} />
          <FieldRow label={t('field_guardian')} value={patient.guardianName ?? empty} />
          <FieldRow
            label={t('field_guardian_relation')}
            value={patient.guardianRelation ?? empty}
          />
          <FieldRow label={t('field_contact_phone')} value={patient.contactPhone ?? empty} />
          <FieldRow label={t('field_contact_email')} value={patient.contactEmail ?? empty} />
        </section>

        <section className="overflow-hidden rounded-xl border border-ink-200 bg-surface-elevated">
          <header className="border-b border-ink-200 px-5 py-3">
            <h2 className="text-xs font-semibold tracking-wider text-ink-500 uppercase">
              {t('section_clinical')}
            </h2>
          </header>
          <FieldRow label={t('field_diagnosis')} value={patient.diagnosis ?? empty} />
          <FieldRow label={t('field_cid')} value={patient.cid ?? empty} />
          <FieldRow label={t('field_main_complaint')} value={patient.mainComplaint ?? empty} />
          <FieldRow label={t('field_school')} value={patient.school ?? empty} />
          <FieldRow
            label={t('field_other_professionals')}
            value={patient.otherProfessionals ?? empty}
          />
          <FieldRow label={t('field_notes')} value={patient.notes ?? empty} />
        </section>
      </div>

      <aside className="space-y-4">
        <section className="rounded-xl border border-ink-200 bg-surface-elevated p-5">
          <h2 className="text-xs font-semibold tracking-wider text-ink-500 uppercase">
            {t('status_title')}
          </h2>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex items-center justify-between">
              <span className="text-ink-700">{t('status_anamnesis')}</span>
              {anamnesis ? (
                <span className="rounded-full bg-accent-50 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-accent-700 uppercase">
                  {t('status_done')}
                </span>
              ) : (
                <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-ink-500 uppercase">
                  {t('status_pending')}
                </span>
              )}
            </li>
            <li className="flex items-center justify-between">
              <span className="text-ink-700">{t('status_plan')}</span>
              {activeObjectivesCount > 0 ? (
                <span className="rounded-full bg-accent-50 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-accent-700 uppercase">
                  {t('status_plan_active', { count: activeObjectivesCount })}
                </span>
              ) : (
                <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-ink-500 uppercase">
                  {t('status_pending')}
                </span>
              )}
            </li>
            <li className="flex items-center justify-between">
              <span className="text-ink-700">{t('status_notes')}</span>
              {notesCount > 0 ? (
                <span className="rounded-full bg-accent-50 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-accent-700 uppercase">
                  {t('status_notes_count', { count: notesCount })}
                </span>
              ) : (
                <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-ink-500 uppercase">
                  {t('status_zero')}
                </span>
              )}
            </li>
          </ul>
        </section>

        <section className="rounded-xl border border-ink-200 bg-surface-elevated p-5">
          <h2 className="text-xs font-semibold tracking-wider text-ink-500 uppercase">
            {t('actions_title')}
          </h2>
          <div className="mt-4 space-y-2">
            <Link
              href={`/dashboard/patients/${patient.id}/anamnesis/`}
              className="block w-full rounded-md bg-brand-500 px-3 py-2 text-center text-xs font-semibold text-white shadow-sm transition hover:bg-brand-600"
            >
              {anamnesis ? t('actions_edit_anamnesis') : t('actions_fill_anamnesis')}
            </Link>
            <Link
              href={`/dashboard/patients/${patient.id}/plan/`}
              className="block w-full rounded-md border border-ink-200 bg-surface-elevated px-3 py-2 text-center text-xs font-semibold text-ink-700 transition hover:border-ink-300"
            >
              {t('actions_open_plan')}
            </Link>
          </div>
        </section>
      </aside>
    </div>
  );
}
