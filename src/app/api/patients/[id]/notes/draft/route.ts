import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import * as z from 'zod';
import {
  buildDraftFromAudio,
  buildDraftFromText,
  buildValuesFromAudio,
  buildValuesFromText,
} from '@/libs/AI';
import { db } from '@/libs/DB';
import { currentAiPeriod, getAiAccess } from '@/libs/Entitlements';
import { resolveTemplate } from '@/libs/Templates';
import { consumeAiCredit, getUserProfile } from '@/libs/UserProfile';
import { patientSchema } from '@/models/Schema';
import { DraftFromTextValidation } from '@/validations/SessionNoteValidation';

// Audio transcription (Whisper) + SOAP structuring are two sequential OpenAI
// calls; longer recordings exceed the platform default timeout. Allow up to 60s.
export const maxDuration = 60;

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

  // Gate: AI structuring needs an unlimited plan or remaining monthly credits.
  const profile = await getUserProfile(userId);
  const access = getAiAccess(profile);
  if (!access.allowed) {
    return NextResponse.json({ error: 'plan_ai_locked' }, { status: 403 });
  }

  // Metered plans spend a monthly credit; only count it once the generation
  // actually succeeds, so a failed transcription never burns a credit.
  const consume = async () => {
    if (!access.unlimited) {
      await consumeAiCredit(userId, currentAiPeriod());
    }
  };

  const contentType = request.headers.get('content-type') ?? '';

  try {
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const audio = formData.get('audio');

      if (!(audio instanceof File)) {
        return NextResponse.json({ error: 'missing_audio' }, { status: 422 });
      }

      const templateField = formData.get('templateId');
      const overrideId = typeof templateField === 'string' ? templateField : undefined;
      const resolved = await resolveTemplate(userId, 'evolucao', overrideId);
      if (resolved.templateId) {
        const result = await buildValuesFromAudio(audio, resolved.definition);
        await consume();
        return NextResponse.json({ draft: { ...result, templateId: resolved.templateId } });
      }

      const draft = await buildDraftFromAudio(audio);
      await consume();
      return NextResponse.json({ draft });
    }

    const body = (await request.json()) as { templateId?: unknown };
    const parse = DraftFromTextValidation.safeParse(body);
    if (!parse.success) {
      return NextResponse.json(z.treeifyError(parse.error), { status: 422 });
    }
    const overrideId = typeof body.templateId === 'string' ? body.templateId : undefined;
    const resolved = await resolveTemplate(userId, 'evolucao', overrideId);
    if (resolved.templateId) {
      const result = await buildValuesFromText(parse.data.text, resolved.definition);
      await consume();
      return NextResponse.json({ draft: { ...result, templateId: resolved.templateId } });
    }

    const draft = await buildDraftFromText(parse.data.text);
    await consume();
    return NextResponse.json({ draft });
  } catch (error) {
    if ((error as Error).message === 'transcription_failed') {
      return NextResponse.json({ error: 'transcription_failed' }, { status: 502 });
    }
    return NextResponse.json({ error: 'draft_failed' }, { status: 500 });
  }
};
