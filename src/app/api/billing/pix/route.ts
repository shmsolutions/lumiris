import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import * as z from 'zod';
import { startPixSubscription } from '@/libs/Asaas';
import { logger } from '@/libs/Logger';
import { getUserProfile, upsertUserProfile } from '@/libs/UserProfile';
import { PixCheckoutValidation } from '@/validations/BillingValidation';

export const POST = async (request: Request) => {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const json = await request.json();
  const parse = PixCheckoutValidation.safeParse(json);
  if (!parse.success) {
    return NextResponse.json(z.treeifyError(parse.error), { status: 422 });
  }

  const profile = await getUserProfile(userId);
  const user = await currentUser().catch(() => null);
  const name =
    profile.therapistName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() ||
    'Terapeuta Lumiris';
  const email = user?.primaryEmailAddress?.emailAddress ?? '';

  const pix = await startPixSubscription({
    userId,
    plan: parse.data.plan,
    customer: { name, email, taxId: parse.data.taxId },
    existingCustomerId: profile.asaasCustomerId,
  }).catch((error: unknown) => {
    logger.error(`Pix subscription failed for ${userId}: ${(error as Error).message}`);
    return null;
  });

  if (!pix) {
    return NextResponse.json({ error: 'pix_failed' }, { status: 502 });
  }

  // Guarda assinatura/cliente (webhook mapeia por subscriptionId) e marca pendente.
  await upsertUserProfile(userId, {
    taxId: parse.data.taxId,
    asaasCustomerId: pix.customerId,
    asaasSubscriptionId: pix.subscriptionId,
    subscriptionStatus: 'pending',
  });

  return NextResponse.json({ qrImage: pix.qrImage, qrPayload: pix.qrPayload });
};
