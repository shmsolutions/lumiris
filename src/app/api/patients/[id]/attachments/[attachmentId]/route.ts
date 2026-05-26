import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { attachmentSchema } from '@/models/Schema';

type RouteContext = { params: Promise<{ id: string; attachmentId: string }> };

const scoped = (attachmentId: string, patientId: string, userId: string) =>
  and(
    eq(attachmentSchema.id, attachmentId),
    eq(attachmentSchema.patientId, patientId),
    eq(attachmentSchema.ownerId, userId),
  );

export const GET = async (_request: Request, context: RouteContext) => {
  const { userId } = await auth();
  const { id, attachmentId } = await context.params;

  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const [attachment] = await db
    .select()
    .from(attachmentSchema)
    .where(scoped(attachmentId, id, userId))
    .limit(1);

  if (!attachment) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const buffer = Buffer.from(attachment.data, 'base64');
  const encodedName = encodeURIComponent(attachment.fileName);

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': attachment.mimeType,
      'Content-Disposition': `inline; filename*=UTF-8''${encodedName}`,
      'Content-Length': String(attachment.sizeBytes),
      'Cache-Control': 'private, no-store',
    },
  });
};

export const DELETE = async (_request: Request, context: RouteContext) => {
  const { userId } = await auth();
  const { id, attachmentId } = await context.params;

  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const [deleted] = await db
    .delete(attachmentSchema)
    .where(scoped(attachmentId, id, userId))
    .returning({ id: attachmentSchema.id });

  if (!deleted) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
};
