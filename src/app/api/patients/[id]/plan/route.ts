import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import * as z from 'zod';
import { db } from '@/libs/DB';
import { patientSchema, treatmentPlanSchema } from '@/models/Schema';
import { TreatmentPlanUpsertValidation } from '@/validations/TreatmentPlanValidation';

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

  const [plan] = await db
    .select()
    .from(treatmentPlanSchema)
    .where(eq(treatmentPlanSchema.patientId, id))
    .limit(1);

  return NextResponse.json({ plan: plan ?? null });
};

export const PUT = async (request: Request, context: RouteContext) => {
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
  const parse = TreatmentPlanUpsertValidation.safeParse(json);

  if (!parse.success) {
    return NextResponse.json(z.treeifyError(parse.error), { status: 422 });
  }

  const [upserted] = await db
    .insert(treatmentPlanSchema)
    .values({
      patientId: id,
      ownerId: userId,
      frequency: parse.data.frequency,
      procedures: parse.data.procedures,
      notes: parse.data.notes,
      objectives: parse.data.objectives,
    })
    .onConflictDoUpdate({
      target: treatmentPlanSchema.patientId,
      set: {
        frequency: parse.data.frequency,
        procedures: parse.data.procedures,
        notes: parse.data.notes,
        objectives: parse.data.objectives,
      },
    })
    .returning();

  return NextResponse.json({ plan: upserted });
};
