import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import * as z from 'zod';
import { getEntitlements } from '@/libs/Entitlements';
import { archiveTemplate, getTemplate, updateTemplate } from '@/libs/Templates';
import { TemplateUpdateValidation } from '@/validations/TemplateValidation';

type RouteContext = { params: Promise<{ templateId: string }> };

export const GET = async (_request: Request, context: RouteContext) => {
  const { userId } = await auth();
  const { templateId } = await context.params;
  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const template = await getTemplate(userId, templateId);
  if (!template) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  return NextResponse.json({ template });
};

export const PUT = async (request: Request, context: RouteContext) => {
  const { userId } = await auth();
  const { templateId } = await context.params;
  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { limits } = await getEntitlements(userId);
  if (!limits.customTemplates) {
    return NextResponse.json({ error: 'plan_required' }, { status: 403 });
  }

  const parse = TemplateUpdateValidation.safeParse(await request.json());
  if (!parse.success) {
    return NextResponse.json(z.treeifyError(parse.error), { status: 422 });
  }

  const updated = await updateTemplate({ ownerId: userId, id: templateId, ...parse.data });
  if (!updated) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  return NextResponse.json({ template: updated });
};

export const DELETE = async (_request: Request, context: RouteContext) => {
  const { userId } = await auth();
  const { templateId } = await context.params;
  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { limits } = await getEntitlements(userId);
  if (!limits.customTemplates) {
    return NextResponse.json({ error: 'plan_required' }, { status: 403 });
  }

  await archiveTemplate(userId, templateId);
  return NextResponse.json({ ok: true });
};
