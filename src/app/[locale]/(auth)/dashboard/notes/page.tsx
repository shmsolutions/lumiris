import { auth } from '@clerk/nextjs/server';
import { desc, eq } from 'drizzle-orm';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { MicIcon, PlusIcon } from '@/components/dashboard/Icons';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { TopBar } from '@/components/dashboard/TopBar';
import { buttonClasses } from '@/components/ui/Button';
import { db } from '@/libs/DB';
import { Link } from '@/libs/I18nNavigation';
import { patientSchema, sessionNoteSchema } from '@/models/Schema';

type NotesPageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata(props: NotesPageProps): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: 'NotesPage' });
  return { title: t('meta_title') };
}

type PreviewableNote = {
  procedimento: string | null;
  intercorrencia: string | null;
  evolucao: string | null;
};

const previewText = (note: PreviewableNote) => {
  const fields = [note.procedimento, note.evolucao, note.intercorrencia].filter((s): s is string =>
    Boolean(s?.trim()),
  );
  return fields[0]?.slice(0, 200) ?? '';
};

export default async function NotesTimelinePage(props: NotesPageProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'NotesPage' });
  const tNav = await getTranslations({ locale, namespace: 'DashboardNav' });

  const { userId } = await auth();

  const notes = userId
    ? await db
        .select({
          id: sessionNoteSchema.id,
          patientId: sessionNoteSchema.patientId,
          patientName: patientSchema.fullName,
          sessionDate: sessionNoteSchema.sessionDate,
          createdAt: sessionNoteSchema.createdAt,
          procedimento: sessionNoteSchema.procedimento,
          intercorrencia: sessionNoteSchema.intercorrencia,
          evolucao: sessionNoteSchema.evolucao,
          transcript: sessionNoteSchema.transcript,
          rawText: sessionNoteSchema.rawText,
          linkedObjectives: sessionNoteSchema.linkedObjectives,
          ownerId: sessionNoteSchema.ownerId,
          updatedAt: sessionNoteSchema.updatedAt,
        })
        .from(sessionNoteSchema)
        .innerJoin(patientSchema, eq(patientSchema.id, sessionNoteSchema.patientId))
        .where(eq(sessionNoteSchema.ownerId, userId))
        .orderBy(desc(sessionNoteSchema.sessionDate), desc(sessionNoteSchema.createdAt))
        .limit(50)
    : [];

  return (
    <>
      <TopBar breadcrumb={tNav('section_workspace')} title={t('title')} />
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <PageHeader title={t('title')} description={t('description')} />

        <div className="mt-8">
          {notes.length === 0 ? (
            <EmptyState
              icon={<MicIcon />}
              title={t('empty_title')}
              description={t('empty_description')}
              action={
                <Link href="/dashboard/patients/" className={buttonClasses('primary', '', 'sm')}>
                  <PlusIcon size={14} />
                  {t('cta_go_patients')}
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
                }).format(new Date(`${note.sessionDate}T12:00:00`));

                return (
                  <li key={note.id}>
                    <Link
                      href={`/dashboard/patients/${note.patientId}/notes/${note.id}/`}
                      className="block rounded-xl border border-ink-200 bg-surface-elevated p-5 transition hover:border-ink-300 hover:shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="font-semibold text-ink-900">{note.patientName}</span>
                            <span className="text-ink-400">·</span>
                            <span className="text-ink-500">{dateLabel}</span>
                          </div>
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
      </div>
    </>
  );
}
