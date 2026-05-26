import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import * as z from 'zod';
import { db } from '@/libs/DB';
import { sessionNoteSchema } from '@/models/Schema';
import { SessionNoteUpdateValidation } from '@/validations/SessionNoteValidation';

type RouteContext = { params: Promise<{ id: string; noteId: string }> };

const scoped = (noteId: string, patientId: string, userId: string) =>
  and(
    eq(sessionNoteSchema.id, noteId),
    eq(sessionNoteSchema.patientId, patientId),
    eq(sessionNoteSchema.ownerId, userId),
  );

export const GET = async (_request: Request, context: RouteContext) => {
  const { userId } = await auth();
  const { id, noteId } = await context.params;

  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const [note] = await db
    .select()
    .from(sessionNoteSchema)
    .where(scoped(noteId, id, userId))
    .limit(1);

  if (!note) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  return NextResponse.json({ note });
};

export const PATCH = async (request: Request, context: RouteContext) => {
  const { userId } = await auth();
  const { id, noteId } = await context.params;

  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const json = await request.json();
  const parse = SessionNoteUpdateValidation.safeParse(json);

  if (!parse.success) {
    return NextResponse.json(z.treeifyError(parse.error), { status: 422 });
  }

  const [updated] = await db
    .update(sessionNoteSchema)
    .set(parse.data)
    .where(scoped(noteId, id, userId))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  return NextResponse.json({ note: updated });
};

export const DELETE = async (_request: Request, context: RouteContext) => {
  const { userId } = await auth();
  const { id, noteId } = await context.params;

  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const [deleted] = await db
    .delete(sessionNoteSchema)
    .where(scoped(noteId, id, userId))
    .returning({ id: sessionNoteSchema.id });

  if (!deleted) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
};
