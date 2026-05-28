import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import * as z from 'zod';
import { upsertUserProfile } from '@/libs/UserProfile';
import { OnboardingValidation } from '@/validations/OnboardingValidation';

export const POST = async (request: Request) => {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const json = await request.json();
  const parse = OnboardingValidation.safeParse(json);
  if (!parse.success) {
    return NextResponse.json(z.treeifyError(parse.error), { status: 422 });
  }

  // Planos pagos só são liberados após confirmação de pagamento (webhook do
  // Asaas). No onboarding a conta começa no free; o cliente segue pro checkout.
  await upsertUserProfile(userId, {
    therapistName: parse.data.therapistName,
    plan: 'free',
    onboarded: true,
  });

  return NextResponse.json({ ok: true, selectedPlan: parse.data.plan });
};
