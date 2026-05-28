import { auth, currentUser } from '@clerk/nextjs/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { and, eq } from 'drizzle-orm';
import { getTranslations } from 'next-intl/server';
import { NextResponse } from 'next/server';
import { SessionNotePDF } from '@/components/pdf/SessionNotePDF';
import { db } from '@/libs/DB';
import { getUserProfile } from '@/libs/UserProfile';
import { patientSchema, sessionNoteSchema } from '@/models/Schema';
import { PLAN_LIMITS } from '@/utils/Plans';

type RouteContext = { params: Promise<{ id: string; noteId: string }> };

const slug = (name: string) =>
  name
    .normalize('NFD')
    .replaceAll(/\p{Diacritic}/gu, '')
    .replaceAll(/[^a-zA-Z0-9]+/g, '-')
    .replaceAll(/^-+|-+$/g, '')
    .toLowerCase() || 'paciente';

export const GET = async (request: Request, context: RouteContext) => {
  const { userId } = await auth();
  const { id, noteId } = await context.params;

  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const [row] = await db
    .select({
      note: sessionNoteSchema,
      patient: patientSchema,
    })
    .from(sessionNoteSchema)
    .innerJoin(patientSchema, eq(patientSchema.id, sessionNoteSchema.patientId))
    .where(
      and(
        eq(sessionNoteSchema.id, noteId),
        eq(sessionNoteSchema.patientId, id),
        eq(sessionNoteSchema.ownerId, userId),
      ),
    )
    .limit(1);

  if (!row) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const localeParam = new URL(request.url).searchParams.get('locale');
  const locale = localeParam === 'en' ? 'en' : 'pt-BR';

  const tPatient = await getTranslations({ locale, namespace: 'PatientHeader' });
  const tPdf = await getTranslations({ locale, namespace: 'SessionNotePdf' });

  const profile = await getUserProfile(userId);
  if (!PLAN_LIMITS[profile.plan].pdf.note) {
    return NextResponse.json({ error: 'plan_pdf_locked' }, { status: 403 });
  }
  const user = await currentUser().catch(() => null);
  const therapistName =
    profile.therapistName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() ||
    user?.primaryEmailAddress?.emailAddress ||
    '';

  const sessionDateLabel = new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${row.note.sessionDate}T12:00:00`));

  const generatedAt = new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date());

  const pdfBuffer = await renderToBuffer(
    <SessionNotePDF
      patientName={row.patient.fullName}
      birthDate={row.patient.birthDate}
      diagnosis={row.patient.diagnosis}
      cid={row.patient.cid}
      sessionDateLabel={sessionDateLabel}
      generatedAtLabel={tPdf('generated_at', { datetime: generatedAt })}
      procedures={row.note.procedimento ?? ''}
      intercorrencia={row.note.intercorrencia ?? ''}
      evolution={row.note.evolucao ?? ''}
      transcript={row.note.transcript}
      therapistName={therapistName}
      therapistCrefito={profile.crefito}
      studentName={profile.studentName || null}
      labels={{
        title: tPdf('title'),
        reference: tPdf('reference'),
        section_evolution: tPdf('section_evolution'),
        field_procedures: tPdf('field_procedures'),
        field_intercorrencia: tPdf('field_intercorrencia'),
        field_evolution: tPdf('field_evolution'),
        born: tPatient('field_birth'),
        diagnosis: tPatient('field_diagnosis'),
        cid: tPatient('field_cid'),
        session_date: tPdf('session_date'),
        therapist_line: tPdf('therapist_line'),
        student_line: tPdf('student_line'),
        transcript_title: tPdf('transcript'),
        transcript_disclaimer: tPdf('transcript_disclaimer'),
        empty_field: tPdf('empty'),
        no_intercorrencia: tPdf('no_intercorrencia'),
      }}
    />,
  );

  const filename = `evolucao-${slug(row.patient.fullName)}-${row.note.sessionDate}.pdf`;

  return new NextResponse(pdfBuffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
};
