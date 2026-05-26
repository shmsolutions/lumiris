import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import * as z from 'zod';
import { upsertUserProfile } from '@/libs/UserProfile';
import { TherapistProfileValidation } from '@/validations/TherapistProfileValidation';

export const PATCH = async (request: Request) => {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const json = await request.json();
  const parse = TherapistProfileValidation.safeParse(json);
  if (!parse.success) {
    return NextResponse.json(z.treeifyError(parse.error), { status: 422 });
  }

  await upsertUserProfile(userId, {
    crefito: parse.data.crefito ?? null,
    studentName: parse.data.studentName ?? null,
  });

  return NextResponse.json({ ok: true });
};
