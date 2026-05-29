import { auth, currentUser } from '@clerk/nextjs/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { and, eq } from 'drizzle-orm';
import { getTranslations } from 'next-intl/server';
import { NextResponse } from 'next/server';
import { ReportPDF } from '@/components/pdf/ReportPDF';
import { TemplatedDocumentPDF } from '@/components/pdf/TemplatedDocumentPDF';
import { db } from '@/libs/DB';
import { buildReportResolved, buildResolvedFromTemplate } from '@/libs/documents/buildResolved';
import { renderDocx } from '@/libs/documents/renderDocx';
import { DOCX_CONTENT_TYPE } from '@/libs/documents/response';
import { getTemplate } from '@/libs/Templates';
import type { TemplateValues } from '@/libs/TemplateSchema';
import { getUserProfile, getUserSignature } from '@/libs/UserProfile';
import { patientSchema, reportSchema } from '@/models/Schema';
import { PLAN_LIMITS } from '@/utils/Plans';
import { ReportContentValidation } from '@/validations/ReportValidation';
import { TemplateDefinitionValidation } from '@/validations/TemplateValidation';

type RouteContext = { params: Promise<{ id: string; reportId: string }> };

const slug = (name: string) =>
  name
    .normalize('NFD')
    .replaceAll(/\p{Diacritic}/gu, '')
    .replaceAll(/[^a-zA-Z0-9]+/g, '-')
    .replaceAll(/^-+|-+$/g, '')
    .toLowerCase() || 'paciente';

export const GET = async (request: Request, context: RouteContext) => {
  const { userId } = await auth();
  const { id, reportId } = await context.params;

  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const [row] = await db
    .select({ report: reportSchema, patient: patientSchema })
    .from(reportSchema)
    .innerJoin(patientSchema, eq(patientSchema.id, reportSchema.patientId))
    .where(
      and(
        eq(reportSchema.id, reportId),
        eq(reportSchema.patientId, id),
        eq(reportSchema.ownerId, userId),
      ),
    )
    .limit(1);

  if (!row) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const localeParam = new URL(request.url).searchParams.get('locale');
  const locale = localeParam === 'en' ? 'en' : 'pt-BR';

  const tPatient = await getTranslations({ locale, namespace: 'PatientHeader' });
  const tPdf = await getTranslations({ locale, namespace: 'ReportPdf' });

  const profile = await getUserProfile(userId);
  if (!PLAN_LIMITS[profile.plan].pdf.report) {
    return NextResponse.json({ error: 'plan_pdf_locked' }, { status: 403 });
  }
  const user = await currentUser().catch(() => null);
  const therapistName =
    profile.therapistName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() ||
    user?.primaryEmailAddress?.emailAddress ||
    '';
  const signature = PLAN_LIMITS[profile.plan].signature ? await getUserSignature(userId) : null;

  const parsedContent = ReportContentValidation.safeParse(row.report.content);
  if (!parsedContent.success) {
    return NextResponse.json({ error: 'invalid_content' }, { status: 422 });
  }
  const content = parsedContent.data;

  const fmtDate = (d: string) =>
    new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date(`${d}T12:00:00`));

  const periodLabel = `${fmtDate(row.report.periodStart)} — ${fmtDate(row.report.periodEnd)}`;

  const generatedAt = new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date());

  const wantsDocx = new URL(request.url).searchParams.get('format') === 'docx';

  // Relatório com modelo custom: renderiza pelo modelo + valores capturados.
  if (row.report.templateId) {
    const template = await getTemplate(userId, row.report.templateId);
    if (template) {
      const doc = buildResolvedFromTemplate(
        TemplateDefinitionValidation.parse(template.definition),
        (row.report.values ?? {}) as TemplateValues,
        {
          title: template.name,
          emptyLabel: tPdf('empty'),
          therapistLine: tPdf('therapist_line'),
          studentLine: tPdf('student_line'),
          therapist: {
            name: therapistName,
            crefito: profile.crefito,
            studentName: profile.studentName || null,
          },
          signatureImageDataUrl: signature?.dataUrl,
          patient: {
            fullName: row.patient.fullName,
            birthDate: row.patient.birthDate ?? '',
            diagnosis: row.patient.diagnosis ?? '',
            cid: row.patient.cid ?? '',
          },
          today: fmtDate(new Date().toISOString().slice(0, 10)),
          periodStart: fmtDate(row.report.periodStart),
          periodEnd: fmtDate(row.report.periodEnd),
          sessionDate: '',
        },
      );
      const ext = wantsDocx ? 'docx' : 'pdf';
      const buffer = wantsDocx
        ? await renderDocx(doc)
        : await renderToBuffer(<TemplatedDocumentPDF doc={doc} />);
      const name = `relatorio-${slug(row.patient.fullName)}-${row.report.periodEnd}.${ext}`;
      return new NextResponse(buffer as unknown as BodyInit, {
        headers: {
          'Content-Type': wantsDocx ? DOCX_CONTENT_TYPE : 'application/pdf',
          'Content-Disposition': `attachment; filename="${name}"`,
          'Cache-Control': 'no-store',
        },
      });
    }
  }

  if (wantsDocx) {
    const docxBuffer = await renderDocx(
      buildReportResolved({
        patientName: row.patient.fullName,
        periodLabel,
        cid: row.patient.cid,
        content,
        therapist: {
          name: therapistName,
          crefito: profile.crefito,
          studentName: profile.studentName || null,
        },
        signatureImageDataUrl: signature?.dataUrl,
        labels: {
          title: tPdf('title'),
          period: tPdf('period'),
          cid: tPatient('field_cid'),
          initial_complaint: tPdf('initial_complaint'),
          general_evolution: tPdf('general_evolution'),
          objective_progress: tPdf('objective_progress'),
          difficulties: tPdf('difficulties'),
          suggestions: tPdf('suggestions'),
          conclusion: tPdf('conclusion'),
          therapist_line: tPdf('therapist_line'),
          student_line: tPdf('student_line'),
          empty: tPdf('empty'),
        },
      }),
    );
    const docxName = `relatorio-${slug(row.patient.fullName)}-${row.report.periodEnd}.docx`;
    return new NextResponse(docxBuffer as unknown as BodyInit, {
      headers: {
        'Content-Type': DOCX_CONTENT_TYPE,
        'Content-Disposition': `attachment; filename="${docxName}"`,
        'Cache-Control': 'no-store',
      },
    });
  }

  const pdfBuffer = await renderToBuffer(
    <ReportPDF
      patientName={row.patient.fullName}
      birthDate={row.patient.birthDate}
      cid={row.patient.cid}
      periodLabel={periodLabel}
      generatedAtLabel={tPdf('generated_at', { datetime: generatedAt })}
      content={content}
      therapist={{
        name: therapistName,
        crefito: profile.crefito,
        studentName: profile.studentName || null,
      }}
      signatureImage={signature?.dataUrl ?? null}
      labels={{
        title: tPdf('title'),
        period: tPdf('period'),
        cid: tPatient('field_cid'),
        initial_complaint: tPdf('initial_complaint'),
        general_evolution: tPdf('general_evolution'),
        objective_progress: tPdf('objective_progress'),
        difficulties: tPdf('difficulties'),
        suggestions: tPdf('suggestions'),
        conclusion: tPdf('conclusion'),
        therapist_line: tPdf('therapist_line'),
        student_line: tPdf('student_line'),
        empty: tPdf('empty'),
      }}
    />,
  );

  const filename = `relatorio-${slug(row.patient.fullName)}-${row.report.periodEnd}.pdf`;

  return new NextResponse(pdfBuffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
};
