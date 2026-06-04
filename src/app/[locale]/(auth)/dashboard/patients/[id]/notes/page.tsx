import { auth } from '@clerk/nextjs/server';
import { and, desc, eq } from 'drizzle-orm';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { MicIcon, PlusIcon } from '@/components/dashboard/Icons';
import { buttonClasses } from '@/components/ui/Button';
import { db } from '@/libs/DB';
import { Link } from '@/libs/I18nNavigation';
import { patientSchema, sessionNoteSchema } from '@/models/Schema';

type NotesPageProps = {
  params: Promise<{ locale: string; id: string }>;
};

const previewText = (note: typeof sessionNoteSchema.$inferSelect) => {
  const fields = [note.procedimento, note.evolucao, note.intercorrencia].filter((s): s is string =>
    Boolean(s?.trim()),
  );
  return fields[0]?.slice(0, 180) ?? '';
};

export default async function PatientNotesListPage(props: NotesPageProps) {
  const { locale, id } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'PatientNotesList' });

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

  const notes = await db
    .select()
    .from(sessionNoteSchema)
    .where(eq(sessionNoteSchema.patientId, id))
    .orderBy(desc(sessionNoteSchema.sessionDate), desc(sessionNoteSchema.createdAt));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-ink-900">{t('title')}</h2>
          <p className="text-sm text-ink-500">{t('description')}</p>
        </div>
        <Link
          href={`/dashboard/patients/${id}/notes/new/`}
          className={buttonClasses('primary', '', 'sm')}
        >
          <PlusIcon size={14} />
          {t('new_note')}
        </Link>
      </div>

      {notes.length === 0 ? (
        <EmptyState
          icon={<MicIcon />}
          title={t('empty_title')}
          description={t('empty_description')}
          action={
            <Link
              href={`/dashboard/patients/${id}/notes/new/`}
              className={buttonClasses('primary', '', 'sm')}
            >
              <PlusIcon size={14} />
              {t('new_note')}
            </Link>
          }
        />
      ) : (
        <ul className="space-y-3">
          {notes.map((note) => {
            const dateLabel = new Intl.DateTimeFormat(locale, {
              weekday: 'short',
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            }).format(new Date(`${note.sessionDate}T12:00:00`));

            return (
              <li key={note.id}>
                <Link
                  href={`/dashboard/patients/${id}/notes/${note.id}/`}
                  className="block rounded-xl border border-ink-200 bg-surface-elevated p-5 transition hover:border-ink-300 hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="editorial-label text-brand-700">{dateLabel}</div>
                      <p className="mt-2 line-clamp-2 text-sm text-ink-700">
                        {previewText(note) || (
                          <span className="text-ink-400">{t('no_content')}</span>
                        )}
                      </p>
                    </div>
                    <span className="shrink-0 text-ink-400">→</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
