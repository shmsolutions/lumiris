import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import * as z from 'zod';
import { db } from '@/libs/DB';
import { patientSchema } from '@/models/Schema';
import { PatientUpdateValidation } from '@/validations/PatientValidation';

type RouteContext = { params: Promise<{ id: string }> };

const scopedById = async (id: string, userId: string) =>
  await db
    .select()
    .from(patientSchema)
    .where(and(eq(patientSchema.id, id), eq(patientSchema.ownerId, userId)))
    .limit(1);

export const GET = async (_request: Request, context: RouteContext) => {
  const { userId } = await auth();
  const { id } = await context.params;

  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const [patient] = await scopedById(id, userId);

  if (!patient) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  return NextResponse.json({ patient });
};

export const PATCH = async (request: Request, context: RouteContext) => {
  const { userId } = await auth();
  const { id } = await context.params;

  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const json = await request.json();
  const parse = PatientUpdateValidation.safeParse(json);

  if (!parse.success) {
    return NextResponse.json(z.treeifyError(parse.error), { status: 422 });
  }

  const [updated] = await db
    .update(patientSchema)
    .set(parse.data)
    .where(and(eq(patientSchema.id, id), eq(patientSchema.ownerId, userId)))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  return NextResponse.json({ patient: updated });
};

export const DELETE = async (_request: Request, context: RouteContext) => {
  const { userId } = await auth();
  const { id } = await context.params;

  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const [archived] = await db
    .update(patientSchema)
    .set({ archivedAt: new Date() })
    .where(and(eq(patientSchema.id, id), eq(patientSchema.ownerId, userId)))
    .returning({ id: patientSchema.id });

  if (!archived) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
};
