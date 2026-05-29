import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import * as z from 'zod';
import { FileIcon } from '@/components/dashboard/Icons';
import { NoteDetail } from '@/components/notes/NoteDetail';
import { db } from '@/libs/DB';
import { getEntitlements } from '@/libs/Entitlements';
import { Link } from '@/libs/I18nNavigation';
import { sessionNoteSchema, treatmentPlanSchema } from '@/models/Schema';
import { TreatmentPlanUpsertValidation } from '@/validations/TreatmentPlanValidation';

const LinkedObjectiveIdsValidation = z.array(z.uuid()).default([]);

type NoteDetailPageProps = {
  params: Promise<{ locale: string; id: string; noteId: string }>;
};

export default async function NoteDetailPage(props: NoteDetailPageProps) {
  const { locale, id, noteId } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'NoteDetailPage' });

  const { userId } = await auth();
  if (!userId) {
    notFound();
  }

  const { limits } = await getEntitlements(userId);
  const canExportPdf = limits.pdf.note;

  const [note] = await db
    .select()
    .from(sessionNoteSchema)
    .where(
      and(
        eq(sessionNoteSchema.id, noteId),
        eq(sessionNoteSchema.patientId, id),
        eq(sessionNoteSchema.ownerId, userId),
      ),
    )
    .limit(1);

  if (!note) {
    notFound();
  }

  const dateLabel = new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${note.sessionDate}T12:00:00`));

  // Resolve linkedObjectives IDs to titles by fetching the plan.
  const linkedIdsParsed = LinkedObjectiveIdsValidation.safeParse(note.linkedObjectives);
  const linkedIds = linkedIdsParsed.success ? linkedIdsParsed.data : [];

  let linkedObjectives: { id: string; title: string }[] = [];
  if (linkedIds.length > 0) {
    const [planRow] = await db
      .select({ objectives: treatmentPlanSchema.objectives })
      .from(treatmentPlanSchema)
      .where(eq(treatmentPlanSchema.patientId, id))
      .limit(1);
    const planObjectives = TreatmentPlanUpsertValidation.shape.objectives.parse(
      planRow?.objectives ?? [],
    );
    linkedObjectives = planObjectives
      .filter((o) => linkedIds.includes(o.id))
      .map(({ id: oid, title }) => ({ id: oid, title }));
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
          <p className="text-sm text-ink-500">{dateLabel}</p>
        </div>
        {canExportPdf ? (
          <div className="flex items-center gap-2">
            <a
              href={`/api/patients/${id}/notes/${note.id}/pdf?locale=${locale}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-ink-200 bg-surface-elevated px-3 py-2 text-xs font-semibold text-ink-700 transition hover:border-ink-300"
            >
              <FileIcon size={14} />
              {t('export_pdf')}
            </a>
            <a
              href={`/api/patients/${id}/notes/${note.id}/pdf?locale=${locale}&format=docx`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-ink-200 bg-surface-elevated px-3 py-2 text-xs font-semibold text-ink-700 transition hover:border-ink-300"
            >
              <FileIcon size={14} />
              {t('export_docx')}
            </a>
          </div>
        ) : (
          <Link
            href="/dashboard/settings/"
            className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-ink-300 px-3 py-2 text-xs font-medium text-ink-500 transition hover:border-ink-400"
            title={t('export_locked_hint')}
          >
            <FileIcon size={14} />
            {t('export_locked')}
          </Link>
        )}
      </div>

      {linkedObjectives.length > 0 ? (
        <section className="rounded-xl border border-ink-200 bg-surface-elevated p-5">
          <h3 className="text-xs font-semibold tracking-wider text-ink-500 uppercase">
            {t('linked_objectives_title')}
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {linkedObjectives.map((objective) => (
              <span
                key={objective.id}
                className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 ring-1 ring-brand-200/70"
              >
                <span className="size-1.5 rounded-full bg-brand-500" />
                {objective.title}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      <NoteDetail
        patientId={id}
        noteId={note.id}
        initialValues={{
          procedimento: note.procedimento ?? '',
          intercorrencia: note.intercorrencia ?? '',
          evolucao: note.evolucao ?? '',
          transcript: note.transcript ?? '',
        }}
      />
    </div>
  );
}
