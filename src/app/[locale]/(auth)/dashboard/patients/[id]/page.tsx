import { auth } from '@clerk/nextjs/server';
import { and, count, desc, eq } from 'drizzle-orm';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { AlertIcon, ArrowRightIcon, CheckIcon, MicIcon } from '@/components/dashboard/Icons';
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

const notePreview = (note: {
  procedimento: string | null;
  evolucao: string | null;
  intercorrencia: string | null;
}) => {
  const fields = [note.procedimento, note.evolucao, note.intercorrencia].filter((s): s is string =>
    Boolean(s?.trim()),
  );
  return fields[0]?.slice(0, 220) ?? '';
};

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

  const [latestNote] = await db
    .select({
      id: sessionNoteSchema.id,
      procedimento: sessionNoteSchema.procedimento,
      intercorrencia: sessionNoteSchema.intercorrencia,
      evolucao: sessionNoteSchema.evolucao,
      sessionDate: sessionNoteSchema.sessionDate,
    })
    .from(sessionNoteSchema)
    .where(eq(sessionNoteSchema.patientId, id))
    .orderBy(desc(sessionNoteSchema.sessionDate), desc(sessionNoteSchema.createdAt))
    .limit(1);

  const [planRow] = await db
    .select({ objectives: treatmentPlanSchema.objectives })
    .from(treatmentPlanSchema)
    .where(eq(treatmentPlanSchema.patientId, id))
    .limit(1);
  const planObjectives: Objective[] = TreatmentPlanUpsertValidation.shape.objectives.parse(
    planRow?.objectives ?? [],
  );
  const activeObjectives = planObjectives.filter((o) => o.status === 'active');
  const topObjectives = activeObjectives.slice(0, 3);

  const empty = <span className="text-ink-400">—</span>;

  const dateFmt = new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const lastSessionLabel = latestNote
    ? dateFmt.format(new Date(`${latestNote.sessionDate}T12:00:00`))
    : null;

  const attentionItems: string[] = [];
  if (!anamnesis) {
    attentionItems.push(t('hub_attention_anamnesis'));
  }
  if (activeObjectives.length === 0) {
    attentionItems.push(t('hub_attention_plan'));
  }
  if (notesCount === 0) {
    attentionItems.push(t('hub_attention_notes'));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        {/* Última sessão — o que aconteceu por último, em destaque. */}
        {latestNote ? (
          <Link
            href={`/dashboard/patients/${id}/notes/${latestNote.id}/`}
            className="group block rounded-2xl border border-ink-200 bg-surface-elevated p-5 transition hover:border-ink-300 hover:shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2">
                <span className="size-2 rounded-full bg-accent-500" />
                <span className="text-xs font-semibold tracking-wider text-accent-700 uppercase">
                  {t('hub_last_session')}
                </span>
              </span>
              <span className="text-xs text-ink-400">{lastSessionLabel}</span>
            </div>
            <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-ink-700">
              {notePreview(latestNote)}
            </p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-700 transition group-hover:gap-1.5 group-hover:text-brand-800">
              {t('hub_read_full')}
              <ArrowRightIcon size={14} />
            </span>
          </Link>
        ) : null}

        {/* Nova evolução — ação principal, sempre à mão. */}
        <Link
          href={`/dashboard/patients/${id}/notes/new/`}
          className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-brand-200/70 bg-brand-50/50 p-5 transition hover:border-brand-300 hover:bg-brand-50"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(90% 80% at 100% 0%, rgba(247,188,116,0.25), transparent 60%)',
            }}
          />
          <div className="relative min-w-0 flex-1">
            <div className="text-base font-semibold text-ink-900">
              {t('hub_new_evolution_title')}
            </div>
            <div className="text-sm text-ink-600">{t('hub_new_evolution_desc')}</div>
          </div>
          <span className="relative inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-sm shadow-brand-500/25 transition group-hover:scale-105">
            <MicIcon size={20} />
          </span>
        </Link>

        <section className="overflow-hidden rounded-2xl border border-ink-200 bg-surface-elevated">
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

        <section className="overflow-hidden rounded-2xl border border-ink-200 bg-surface-elevated">
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
        {/* Atenção necessária — só aparece quando há pendência real. */}
        {attentionItems.length > 0 ? (
          <section className="rounded-2xl border border-brand-200/70 bg-brand-50/40 p-5">
            <div className="flex items-center gap-2">
              <AlertIcon className="text-brand-600" size={18} />
              <h2 className="text-xs font-semibold tracking-wider text-brand-700 uppercase">
                {t('hub_attention_title')}
              </h2>
            </div>
            <ul className="mt-3 space-y-2">
              {attentionItems.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 rounded-lg border border-ink-200/70 bg-surface-elevated px-3 py-2.5 text-sm text-ink-700"
                >
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-500" />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <section className="flex items-center gap-2 rounded-2xl border border-accent-500/30 bg-accent-50 px-5 py-4 text-sm text-accent-700">
            <CheckIcon size={18} />
            {t('hub_attention_none')}
          </section>
        )}

        <section className="rounded-2xl border border-ink-200 bg-surface-elevated p-5">
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
              {activeObjectives.length > 0 ? (
                <span className="rounded-full bg-accent-50 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-accent-700 uppercase">
                  {t('status_plan_active', { count: activeObjectives.length })}
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

        {/* Objetivos em andamento — puxados do plano terapêutico. */}
        <section className="rounded-2xl border border-ink-200 bg-surface-elevated p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold tracking-wider text-ink-500 uppercase">
              {t('hub_goals_title')}
            </h2>
            <Link
              href={`/dashboard/patients/${id}/plan/`}
              className="text-xs font-semibold text-brand-700 transition hover:text-brand-800"
            >
              {t('hub_goals_view_all')} →
            </Link>
          </div>
          {topObjectives.length > 0 ? (
            <ul className="mt-4 space-y-3">
              {topObjectives.map((objective) => (
                <li
                  key={objective.id}
                  className="rounded-lg border border-ink-200/70 bg-ink-50/40 px-3 py-2.5"
                >
                  <div className="flex items-start gap-2.5">
                    <span className="mt-1 h-8 w-1 shrink-0 rounded-full bg-brand-400" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-ink-800">{objective.title}</div>
                      {objective.targetDate ? (
                        <div className="mt-0.5 text-xs text-ink-500">
                          {t('hub_goals_target', {
                            date: dateFmt.format(new Date(`${objective.targetDate}T12:00:00`)),
                          })}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-ink-400">{t('hub_goals_empty')}</p>
          )}
        </section>

        <section className="rounded-2xl border border-ink-200 bg-surface-elevated p-5">
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
