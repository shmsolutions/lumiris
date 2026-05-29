import { auth } from '@clerk/nextjs/server';
import { and, asc, eq, gte, lte } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import * as z from 'zod';
import { generateReport, generateReportValues } from '@/libs/AI';
import type { ReportSource } from '@/libs/AI';
import { db } from '@/libs/DB';
import { getEntitlements } from '@/libs/Entitlements';
import { resolveTemplate } from '@/libs/Templates';
import {
  anamnesisSchema,
  patientSchema,
  sessionNoteSchema,
  treatmentPlanSchema,
} from '@/models/Schema';
import { AnamnesisDataValidation } from '@/validations/AnamnesisValidation';
import { ReportGenerateValidation } from '@/validations/ReportValidation';
import { TreatmentPlanUpsertValidation } from '@/validations/TreatmentPlanValidation';

type RouteContext = { params: Promise<{ id: string }> };

export const POST = async (request: Request, context: RouteContext) => {
  const { userId } = await auth();
  const { id } = await context.params;

  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  // Gate: report generation requires a paid plan.
  const { limits } = await getEntitlements(userId);
  if (!limits.ai) {
    return NextResponse.json({ error: 'plan_ai_locked' }, { status: 403 });
  }

  const json = await request.json();
  const parse = ReportGenerateValidation.safeParse(json);
  if (!parse.success) {
    return NextResponse.json(z.treeifyError(parse.error), { status: 422 });
  }

  const [patient] = await db
    .select()
    .from(patientSchema)
    .where(and(eq(patientSchema.id, id), eq(patientSchema.ownerId, userId)))
    .limit(1);

  if (!patient) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const [anamnesisRow] = await db
    .select()
    .from(anamnesisSchema)
    .where(eq(anamnesisSchema.patientId, id))
    .limit(1);
  const anamnesisData = AnamnesisDataValidation.safeParse(anamnesisRow?.data ?? {});
  const anamnesis = anamnesisData.success ? anamnesisData.data : AnamnesisDataValidation.parse({});

  const [planRow] = await db
    .select()
    .from(treatmentPlanSchema)
    .where(eq(treatmentPlanSchema.patientId, id))
    .limit(1);
  const objectives = TreatmentPlanUpsertValidation.shape.objectives.parse(
    planRow?.objectives ?? [],
  );
  const objectiveTitleById = new Map(objectives.map((o) => [o.id, o.title]));

  const notes = await db
    .select()
    .from(sessionNoteSchema)
    .where(
      and(
        eq(sessionNoteSchema.patientId, id),
        gte(sessionNoteSchema.sessionDate, parse.data.periodStart),
        lte(sessionNoteSchema.sessionDate, parse.data.periodEnd),
      ),
    )
    .orderBy(asc(sessionNoteSchema.sessionDate));

  const anamnesisSummary = [
    anamnesis.clinicalHistory.mainComplaint,
    anamnesis.initialAssessment.generalImpression,
    anamnesis.otDiagnosis.text,
  ]
    .filter(Boolean)
    .join(' ');

  const source: ReportSource = {
    patientName: patient.fullName,
    mainComplaint: patient.mainComplaint ?? anamnesis.clinicalHistory.mainComplaint ?? '',
    anamnesisSummary,
    objectives: objectives.map((o) => ({
      title: o.title,
      description: o.description ?? '',
      status: o.status,
    })),
    notes: notes.map((n) => {
      const linkedIds = Array.isArray(n.linkedObjectives) ? (n.linkedObjectives as string[]) : [];
      return {
        date: n.sessionDate,
        procedimento: n.procedimento ?? '',
        intercorrencia: n.intercorrencia ?? '',
        evolucao: n.evolucao ?? '',
        linkedObjectiveTitles: linkedIds
          .map((oid) => objectiveTitleById.get(oid))
          .filter((title): title is string => Boolean(title)),
      };
    }),
    periodStart: parse.data.periodStart,
    periodEnd: parse.data.periodEnd,
  };

  const resolved = await resolveTemplate(userId, 'relatorio', parse.data.templateId);
  const meta = { notesCount: notes.length, objectivesCount: objectives.length };

  try {
    if (resolved.templateId) {
      const values = await generateReportValues(source, resolved.definition);
      return NextResponse.json({ values, templateId: resolved.templateId, meta });
    }
    const content = await generateReport(source);
    return NextResponse.json({ content, meta });
  } catch {
    return NextResponse.json({ error: 'generation_failed' }, { status: 500 });
  }
};
