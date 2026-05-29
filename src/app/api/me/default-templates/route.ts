import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import * as z from 'zod';
import { getEntitlements } from '@/libs/Entitlements';
import { getDefaultTemplates, upsertUserProfile } from '@/libs/UserProfile';
import { DocTypeValidation } from '@/validations/TemplateValidation';

const BodyValidation = z.object({
  docType: DocTypeValidation,
  /** null limpa o padrão (volta pro modelo padrão CREFITO em código). */
  templateId: z.uuid().nullable(),
});

export const PATCH = async (request: Request) => {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { limits } = await getEntitlements(userId);
  if (!limits.customTemplates) {
    return NextResponse.json({ error: 'plan_required' }, { status: 403 });
  }

  const parse = BodyValidation.safeParse(await request.json());
  if (!parse.success) {
    return NextResponse.json(z.treeifyError(parse.error), { status: 422 });
  }

  const current = await getDefaultTemplates(userId);
  // templateId null vira undefined → a chave some do JSONB (volta pro padrão em código).
  const next = { ...current, [parse.data.docType]: parse.data.templateId ?? undefined };

  await upsertUserProfile(userId, { defaultTemplates: next });
  return NextResponse.json({ ok: true });
};
