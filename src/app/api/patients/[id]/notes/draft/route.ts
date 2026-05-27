import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import * as z from 'zod';
import { buildDraftFromAudio, buildDraftFromText } from '@/libs/AI';
import { db } from '@/libs/DB';
import { getEntitlements } from '@/libs/Entitlements';
import { patientSchema } from '@/models/Schema';
import { DraftFromTextValidation } from '@/validations/SessionNoteValidation';

type RouteContext = { params: Promise<{ id: string }> };

const assertPatientOwned = async (patientId: string, userId: string) => {
  const [patient] = await db
    .select({ id: patientSchema.id })
    .from(patientSchema)
    .where(and(eq(patientSchema.id, patientId), eq(patientSchema.ownerId, userId)))
    .limit(1);
  return patient;
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

  // Gate: AI structuring requires a paid plan.
  const { limits } = await getEntitlements(userId);
  if (!limits.ai) {
    return NextResponse.json({ error: 'plan_ai_locked' }, { status: 403 });
  }

  const contentType = request.headers.get('content-type') ?? '';

  try {
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const audio = formData.get('audio');

      if (!(audio instanceof File)) {
        return NextResponse.json({ error: 'missing_audio' }, { status: 422 });
      }

      const draft = await buildDraftFromAudio(audio);
      return NextResponse.json({ draft });
    }

    const parse = DraftFromTextValidation.safeParse(await request.json());
    if (!parse.success) {
      return NextResponse.json(z.treeifyError(parse.error), { status: 422 });
    }
    const draft = await buildDraftFromText(parse.data.text);
    return NextResponse.json({ draft });
  } catch (error) {
    if ((error as Error).message === 'transcription_failed') {
      return NextResponse.json({ error: 'transcription_failed' }, { status: 502 });
    }
    return NextResponse.json({ error: 'draft_failed' }, { status: 500 });
  }
};
