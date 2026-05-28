import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import * as z from 'zod';
import { logger } from '@/libs/Logger';
import { upsertUserProfile } from '@/libs/UserProfile';
import { createSubscription } from '@/libs/Woovi';
import { isPaidPlan } from '@/utils/Plans';
import type { PaidPlanId, PlanId } from '@/utils/Plans';
import { CheckoutValidation } from '@/validations/BillingValidation';

/**
 * Create the Woovi subscription for a user and persist its reference. The plan
 * is only unlocked once the payment webhook confirms it. Returns the checkout
 * URL, or null on failure.
 */
const startCheckout = async (userId: string, plan: PaidPlanId): Promise<string | null> => {
  const user = await currentUser().catch(() => null);
  const name =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() || 'Terapeuta Lumiris';
  const email = user?.primaryEmailAddress?.emailAddress ?? '';

  const subscription = await createSubscription({ userId, plan, customer: { name, email } }).catch(
    (error: unknown) => {
      logger.error(`Checkout failed for ${userId}: ${(error as Error).message}`);
      return null;
    },
  );

  if (!subscription) {
    return null;
  }

  await upsertUserProfile(userId, {
    wooviSubscriptionId: subscription.subscriptionId,
    subscriptionStatus: 'pending',
  });

  return subscription.checkoutUrl;
};

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

  const checkoutUrl = await startCheckout(userId, parse.data.plan);
  if (!checkoutUrl) {
    return NextResponse.json({ error: 'checkout_failed' }, { status: 502 });
  }

  return NextResponse.json({ checkoutUrl });
};

/**
 * Entry point for the marketing pricing CTA, which is a plain link (the
 * landing page has no Clerk context). Logged-out visitors are sent to sign-up;
 * logged-in ones go straight to the plan's checkout.
 */
export const GET = async (request: Request) => {
  const { userId } = await auth();
  const plan = new URL(request.url).searchParams.get('plan') as PlanId | null;

  if (!userId) {
    return NextResponse.redirect(new URL('/sign-up/', request.url));
  }
  if (!plan || !isPaidPlan(plan)) {
    return NextResponse.redirect(new URL('/dashboard/', request.url));
  }

  const checkoutUrl = await startCheckout(userId, plan);
  return NextResponse.redirect(new URL(checkoutUrl ?? '/dashboard/settings/billing/', request.url));
};
