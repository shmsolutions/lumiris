import { auth } from '@clerk/nextjs/server';
import { and, count, desc, eq, isNull } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import * as z from 'zod';
import { db } from '@/libs/DB';
import { getEntitlements } from '@/libs/Entitlements';
import { patientSchema } from '@/models/Schema';
import { PatientCreateValidation } from '@/validations/PatientValidation';

export const GET = async () => {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const patients = await db
    .select()
    .from(patientSchema)
    .where(and(eq(patientSchema.ownerId, userId), isNull(patientSchema.archivedAt)))
    .orderBy(desc(patientSchema.updatedAt));

  return NextResponse.json({ patients });
};

export const POST = async (request: Request) => {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const json = await request.json();
  const parse = PatientCreateValidation.safeParse(json);

  if (!parse.success) {
    return NextResponse.json(z.treeifyError(parse.error), { status: 422 });
  }

  // Enforce the plan's active-patient limit.
  const { limits } = await getEntitlements(userId);
  if (Number.isFinite(limits.maxPatients)) {
    const [row] = await db
      .select({ value: count() })
      .from(patientSchema)
      .where(and(eq(patientSchema.ownerId, userId), isNull(patientSchema.archivedAt)));
    if ((row?.value ?? 0) >= limits.maxPatients) {
      return NextResponse.json({ error: 'plan_limit', limit: limits.maxPatients }, { status: 403 });
    }
  }

  const [created] = await db
    .insert(patientSchema)
    .values({ ...parse.data, ownerId: userId })
    .returning();

  return NextResponse.json({ patient: created }, { status: 201 });
};
