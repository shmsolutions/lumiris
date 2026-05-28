import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import * as z from 'zod';
import { logger } from '@/libs/Logger';
import { upsertUserProfile } from '@/libs/UserProfile';
import { createSubscription } from '@/libs/Woovi';
import { CheckoutValidation } from '@/validations/BillingValidation';

export const POST = async (request: Request) => {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const json = await request.json();
  const parse = CheckoutValidation.safeParse(json);
  if (!parse.success) {
    return NextResponse.json(z.treeifyError(parse.error), { status: 422 });
  }

  const user = await currentUser().catch(() => null);
  const name =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() || 'Terapeuta Lumiris';
  const email = user?.primaryEmailAddress?.emailAddress ?? '';

  const subscription = await createSubscription({
    userId,
    plan: parse.data.plan,
    customer: { name, email },
  }).catch((error: unknown) => {
    logger.error(`Checkout failed for ${userId}: ${(error as Error).message}`);
    return null;
  });

  if (!subscription) {
    return NextResponse.json({ error: 'checkout_failed' }, { status: 502 });
  }

  // Guarda a referência da assinatura; o plano só é liberado quando o webhook
  // confirmar o pagamento.
  await upsertUserProfile(userId, {
    wooviSubscriptionId: subscription.subscriptionId,
    subscriptionStatus: 'pending',
  });

  return NextResponse.json({ checkoutUrl: subscription.checkoutUrl });
};
