import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import * as z from 'zod';
import { db } from '@/libs/DB';
import { appointmentSchema } from '@/models/Schema';
import { AppointmentUpdateValidation } from '@/validations/AppointmentValidation';

type RouteContext = { params: Promise<{ id: string }> };

const scoped = (id: string, userId: string) =>
  and(eq(appointmentSchema.id, id), eq(appointmentSchema.ownerId, userId));

export const GET = async (_request: Request, context: RouteContext) => {
  const { userId } = await auth();
  const { id } = await context.params;

  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const [appointment] = await db
    .select()
    .from(appointmentSchema)
    .where(scoped(id, userId))
    .limit(1);

  if (!appointment) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  return NextResponse.json({ appointment });
};

export const PATCH = async (request: Request, context: RouteContext) => {
  const { userId } = await auth();
  const { id } = await context.params;

  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const json = await request.json();
  const parse = AppointmentUpdateValidation.safeParse(json);

  if (!parse.success) {
    return NextResponse.json(z.treeifyError(parse.error), { status: 422 });
  }

  const updateValues: Partial<typeof appointmentSchema.$inferInsert> = {};
  if (parse.data.patientId !== undefined) {
    updateValues.patientId = parse.data.patientId;
  }
  if (parse.data.startsAt !== undefined) {
    updateValues.startsAt = new Date(parse.data.startsAt);
  }
  if (parse.data.durationMinutes !== undefined) {
    updateValues.durationMinutes = parse.data.durationMinutes;
  }
  if (parse.data.status !== undefined) {
    updateValues.status = parse.data.status;
  }
  if (parse.data.notes !== undefined) {
    updateValues.notes = parse.data.notes;
  }

  const [updated] = await db
    .update(appointmentSchema)
    .set(updateValues)
    .where(scoped(id, userId))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  return NextResponse.json({ appointment: updated });
};

export const DELETE = async (_request: Request, context: RouteContext) => {
  const { userId } = await auth();
  const { id } = await context.params;

  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const [deleted] = await db
    .delete(appointmentSchema)
    .where(scoped(id, userId))
    .returning({ id: appointmentSchema.id });

  if (!deleted) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
};
