import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import * as z from 'zod';
import { db } from '@/libs/DB';
import { reportSchema } from '@/models/Schema';
import { ReportUpdateValidation } from '@/validations/ReportValidation';

type RouteContext = { params: Promise<{ id: string; reportId: string }> };

const scoped = (reportId: string, patientId: string, userId: string) =>
  and(
    eq(reportSchema.id, reportId),
    eq(reportSchema.patientId, patientId),
    eq(reportSchema.ownerId, userId),
  );

export const GET = async (_request: Request, context: RouteContext) => {
  const { userId } = await auth();
  const { id, reportId } = await context.params;

  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const [report] = await db
    .select()
    .from(reportSchema)
    .where(scoped(reportId, id, userId))
    .limit(1);

  if (!report) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  return NextResponse.json({ report });
};

export const PATCH = async (request: Request, context: RouteContext) => {
  const { userId } = await auth();
  const { id, reportId } = await context.params;

  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const json = await request.json();
  const parse = ReportUpdateValidation.safeParse(json);
  if (!parse.success) {
    return NextResponse.json(z.treeifyError(parse.error), { status: 422 });
  }

  const [updated] = await db
    .update(reportSchema)
    .set({ content: parse.data.content })
    .where(scoped(reportId, id, userId))
    .returning({ id: reportSchema.id });

  if (!updated) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  return NextResponse.json({ report: updated });
};

export const DELETE = async (_request: Request, context: RouteContext) => {
  const { userId } = await auth();
  const { id, reportId } = await context.params;

  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const [deleted] = await db
    .delete(reportSchema)
    .where(scoped(reportId, id, userId))
    .returning({ id: reportSchema.id });

  if (!deleted) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
};
