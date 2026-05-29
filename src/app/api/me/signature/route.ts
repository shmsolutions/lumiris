import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getEntitlements } from '@/libs/Entitlements';
import { upsertUserProfile } from '@/libs/UserProfile';

const MAX_BYTES = 1024 * 1024; // 1 MB — assinaturas são pequenas.
const ALLOWED = new Set(['image/png', 'image/jpeg']);

export const POST = async (request: Request) => {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { limits } = await getEntitlements(userId);
  if (!limits.signature) {
    return NextResponse.json({ error: 'plan_required' }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get('file');
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

  await upsertUserProfile(userId, {
    signatureData: Buffer.from(arrayBuffer).toString('base64'),
    signatureMime: file.type,
  });

  return NextResponse.json({ ok: true }, { status: 201 });
};

export const DELETE = async () => {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  await upsertUserProfile(userId, { signatureData: null, signatureMime: null });
  return NextResponse.json({ ok: true });
};
