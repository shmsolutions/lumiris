import { auth } from '@clerk/nextjs/server';
import { and, desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import * as z from 'zod';
import { db } from '@/libs/DB';
import { patientSchema, sessionNoteSchema } from '@/models/Schema';
import { SessionNoteCreateValidation } from '@/validations/SessionNoteValidation';

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

  const notes = await db
    .select()
    .from(sessionNoteSchema)
    .where(eq(sessionNoteSchema.patientId, id))
    .orderBy(desc(sessionNoteSchema.sessionDate), desc(sessionNoteSchema.createdAt));

  return NextResponse.json({ notes });
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
  const parse = SessionNoteCreateValidation.safeParse(json);

  if (!parse.success) {
    return NextResponse.json(z.treeifyError(parse.error), { status: 422 });
  }

  const [created] = await db
    .insert(sessionNoteSchema)
    .values({ ...parse.data, patientId: id, ownerId: userId })
    .returning();

  return NextResponse.json({ note: created }, { status: 201 });
};
