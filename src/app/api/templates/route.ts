import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import * as z from 'zod';
import { getEntitlements } from '@/libs/Entitlements';
import { createTemplate, listTemplates } from '@/libs/Templates';
import { DocTypeValidation, TemplateCreateValidation } from '@/validations/TemplateValidation';

export const GET = async (request: Request) => {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const docTypeParam = new URL(request.url).searchParams.get('docType');
  const docType = DocTypeValidation.safeParse(docTypeParam);
  const templates = await listTemplates(userId, docType.success ? docType.data : undefined);
  return NextResponse.json({ templates });
};

export const POST = async (request: Request) => {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { limits } = await getEntitlements(userId);
  if (!limits.customTemplates) {
    return NextResponse.json({ error: 'plan_required' }, { status: 403 });
  }

  const parse = TemplateCreateValidation.safeParse(await request.json());
  if (!parse.success) {
    return NextResponse.json(z.treeifyError(parse.error), { status: 422 });
  }

  const created = await createTemplate({ ownerId: userId, ...parse.data });
  return NextResponse.json({ template: created }, { status: 201 });
};
