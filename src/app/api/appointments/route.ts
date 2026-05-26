import { auth } from '@clerk/nextjs/server';
import { and, asc, eq, gte, lt } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import * as z from 'zod';
import { db } from '@/libs/DB';
import { appointmentSchema, patientSchema } from '@/models/Schema';
import { AppointmentCreateValidation } from '@/validations/AppointmentValidation';

const parseDate = (value: string | null) => {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const GET = async (request: Request) => {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const from = parseDate(url.searchParams.get('from'));
  const to = parseDate(url.searchParams.get('to'));

  const conditions = [eq(appointmentSchema.ownerId, userId)];
  if (from) {
    conditions.push(gte(appointmentSchema.startsAt, from));
  }
  if (to) {
    conditions.push(lt(appointmentSchema.startsAt, to));
  }

  const appointments = await db
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
    .where(and(...conditions))
    .orderBy(asc(appointmentSchema.startsAt));

  return NextResponse.json({ appointments });
};

export const POST = async (request: Request) => {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const json = await request.json();
  const parse = AppointmentCreateValidation.safeParse(json);

  if (!parse.success) {
    return NextResponse.json(z.treeifyError(parse.error), { status: 422 });
  }

  // Verify patient belongs to this user.
  const [patient] = await db
    .select({ id: patientSchema.id })
    .from(patientSchema)
    .where(and(eq(patientSchema.id, parse.data.patientId), eq(patientSchema.ownerId, userId)))
    .limit(1);

  if (!patient) {
    return NextResponse.json({ error: 'patient_not_found' }, { status: 404 });
  }

  const [created] = await db
    .insert(appointmentSchema)
    .values({
      patientId: parse.data.patientId,
      ownerId: userId,
      startsAt: new Date(parse.data.startsAt),
      durationMinutes: parse.data.durationMinutes,
      status: parse.data.status,
      notes: parse.data.notes,
    })
    .returning();

  return NextResponse.json({ appointment: created }, { status: 201 });
};
