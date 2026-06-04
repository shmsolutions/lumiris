import { auth } from '@clerk/nextjs/server';
import { and, asc, eq, isNull } from 'drizzle-orm';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { TopBar } from '@/components/dashboard/TopBar';
import { AppointmentForm } from '@/components/schedule/AppointmentForm';
import { buttonClasses } from '@/components/ui/Button';
import { db } from '@/libs/DB';
import { Link } from '@/libs/I18nNavigation';
import { appointmentSchema, patientSchema, sessionNoteSchema } from '@/models/Schema';

type EditAppointmentPageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export async function generateMetadata(props: EditAppointmentPageProps): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: 'EditAppointmentPage' });
  return { title: t('meta_title') };
}

const toLocalDateTimeInput = (date: Date) => {
  const yyyy = date.getFullYear();
  const mm = `${date.getMonth() + 1}`.padStart(2, '0');
  const dd = `${date.getDate()}`.padStart(2, '0');
  const hh = `${date.getHours()}`.padStart(2, '0');
  const mn = `${date.getMinutes()}`.padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${mn}`;
};

export default async function EditAppointmentPage(props: EditAppointmentPageProps) {
  const { locale, id } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'EditAppointmentPage' });
  const tList = await getTranslations({ locale, namespace: 'SchedulePage' });

  const { userId } = await auth();
  if (!userId) {
    notFound();
  }

  const [appointment] = await db
    .select({
      id: appointmentSchema.id,
      patientId: appointmentSchema.patientId,
      patientName: patientSchema.fullName,
      startsAt: appointmentSchema.startsAt,
      durationMinutes: appointmentSchema.durationMinutes,
      status: appointmentSchema.status,
      notes: appointmentSchema.notes,
    })
    .from(appointmentSchema)
    .innerJoin(patientSchema, eq(patientSchema.id, appointmentSchema.patientId))
    .where(and(eq(appointmentSchema.id, id), eq(appointmentSchema.ownerId, userId)))
    .limit(1);

  if (!appointment) {
    notFound();
  }

  const patients = await db
    .select({ id: patientSchema.id, fullName: patientSchema.fullName })
    .from(patientSchema)
    .where(and(eq(patientSchema.ownerId, userId), isNull(patientSchema.archivedAt)))
    .orderBy(asc(patientSchema.fullName));

  // Check if a session note is already linked to this appointment.
  const [linkedNote] = await db
    .select({ id: sessionNoteSchema.id, patientId: sessionNoteSchema.patientId })
    .from(sessionNoteSchema)
    .where(eq(sessionNoteSchema.appointmentId, id))
    .limit(1);

  const dateLabel = new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(appointment.startsAt);

  return (
    <>
      <TopBar
        breadcrumb={
          <Link href="/dashboard/schedule/" className="transition hover:text-ink-900">
            {tList('title')}
          </Link>
        }
        title={appointment.patientName}
      />
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <PageHeader
          eyebrow={dateLabel}
          title={appointment.patientName}
          description={t('description')}
          actions={
            linkedNote ? (
              <Link
                href={`/dashboard/patients/${linkedNote.patientId}/notes/${linkedNote.id}/`}
                className={buttonClasses('secondary', '', 'sm')}
              >
                {t('view_note')}
              </Link>
            ) : (
              <Link
                href={`/dashboard/patients/${appointment.patientId}/notes/new/?appointment=${appointment.id}`}
                className={buttonClasses('primary', '', 'sm')}
              >
                {t('record_note')}
              </Link>
            )
          }
        />

        <div className="mt-8">
          <AppointmentForm
            patients={patients}
            editingId={appointment.id}
            initial={{
              patientId: appointment.patientId,
              startsAt: toLocalDateTimeInput(appointment.startsAt),
              durationMinutes: appointment.durationMinutes,
              status: appointment.status as 'scheduled' | 'completed' | 'cancelled',
              notes: appointment.notes ?? '',
            }}
          />
        </div>
      </div>
    </>
  );
}
