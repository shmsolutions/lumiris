import { auth } from '@clerk/nextjs/server';
import { and, desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { attachmentSchema, patientSchema } from '@/models/Schema';

type RouteContext = { params: Promise<{ id: string }> };

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_CATEGORIES = new Set(['laudo', 'parecer', 'outro']);

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

  const attachments = await db
    .select({
      id: attachmentSchema.id,
      fileName: attachmentSchema.fileName,
      mimeType: attachmentSchema.mimeType,
      sizeBytes: attachmentSchema.sizeBytes,
      category: attachmentSchema.category,
      createdAt: attachmentSchema.createdAt,
    })
    .from(attachmentSchema)
    .where(eq(attachmentSchema.patientId, id))
    .orderBy(desc(attachmentSchema.createdAt));

  return NextResponse.json({ attachments });
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

  const formData = await request.formData();
  const file = formData.get('file');
  const categoryValue = formData.get('category');
  const categoryRaw = typeof categoryValue === 'string' ? categoryValue : 'outro';
  const category = ALLOWED_CATEGORIES.has(categoryRaw) ? categoryRaw : 'outro';

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'missing_file' }, { status: 422 });
  }

  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: 'invalid_type' }, { status: 422 });
  }

  const arrayBuffer = await file.arrayBuffer();
  if (arrayBuffer.byteLength > MAX_BYTES) {
    return NextResponse.json({ error: 'too_large' }, { status: 413 });
  }

  const base64 = Buffer.from(arrayBuffer).toString('base64');

  const [created] = await db
    .insert(attachmentSchema)
    .values({
      patientId: id,
      ownerId: userId,
      fileName: file.name.slice(0, 255),
      mimeType: file.type,
      sizeBytes: arrayBuffer.byteLength,
      category,
      data: base64,
    })
    .returning({ id: attachmentSchema.id });

  return NextResponse.json({ attachment: created }, { status: 201 });
};
