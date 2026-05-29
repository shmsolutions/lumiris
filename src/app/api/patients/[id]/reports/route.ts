import { auth } from '@clerk/nextjs/server';
import { and, desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import * as z from 'zod';
import { db } from '@/libs/DB';
import { patientSchema, reportSchema } from '@/models/Schema';
import { ReportCreateValidation } from '@/validations/ReportValidation';

type RouteContext = { params: Promise<{ id: string }> };

const assertPatientOwned = async (patientId: string, userId: string) => {
  const [patient] = await db
    .select({ id: patientSchema.id })
    .from(patientSchema)
    .where(and(eq(patientSchema.id, patientId), eq(patientSchema.ownerId, userId)))
    .limit(1);
  return patient;
};

export const GET = async (_request: Request, context: RouteContext) => {
  const { userId } = await auth();
  const { id } = await context.params;

  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const patient = await assertPatientOwned(id, userId);
  if (!patient) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const reports = await db
    .select({
      id: reportSchema.id,
      periodStart: reportSchema.periodStart,
      periodEnd: reportSchema.periodEnd,
      status: reportSchema.status,
      createdAt: reportSchema.createdAt,
      updatedAt: reportSchema.updatedAt,
    })
    .from(reportSchema)
    .where(eq(reportSchema.patientId, id))
    .orderBy(desc(reportSchema.createdAt));

  return NextResponse.json({ reports });
};

export const POST = async (request: Request, context: RouteContext) => {
  const { userId } = await auth();
  const { id } = await context.params;

  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const patient = await assertPatientOwned(id, userId);
  if (!patient) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const json = await request.json();
  const parse = ReportCreateValidation.safeParse(json);
  if (!parse.success) {
    return NextResponse.json(z.treeifyError(parse.error), { status: 422 });
  }

  const [created] = await db
    .insert(reportSchema)
    .values({
      patientId: id,
      ownerId: userId,
      periodStart: parse.data.periodStart,
      periodEnd: parse.data.periodEnd,
      content: parse.data.content,
      templateId: parse.data.templateId ?? null,
      values: parse.data.values ?? null,
      status: 'final',
    })
    .returning({ id: reportSchema.id });

  // Novo relatório → reinicia o ciclo de lembrete deste paciente.
  await db
    .update(patientSchema)
    .set({ reportReminderSentAt: null })
    .where(eq(patientSchema.id, id));

  return NextResponse.json({ report: created }, { status: 201 });
};
