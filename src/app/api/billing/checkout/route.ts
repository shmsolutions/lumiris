import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import * as z from 'zod';
import { logger } from '@/libs/Logger';
import { upsertUserProfile } from '@/libs/UserProfile';
import { createCharge } from '@/libs/Woovi';
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

  const charge = await createCharge({ userId, plan, customer: { name, email } }).catch(
    (error: unknown) => {
      logger.error(`Checkout failed for ${userId}: ${(error as Error).message}`);
      return null;
    },
  );

  if (!charge) {
    return null;
  }

  await upsertUserProfile(userId, {
    wooviSubscriptionId: charge.chargeId,
    subscriptionStatus: 'pending',
  });

  return charge.checkoutUrl;
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
// A relative Location lets the browser resolve it against the public domain it
// requested; building an absolute URL from request.url would leak the internal
// proxy host (e.g. 0.0.0.0:3000) behind Traefik.
const redirectTo = (location: string) =>
  new NextResponse(null, { status: 302, headers: { Location: location } });

export const GET = async (request: Request) => {
  const { userId } = await auth();
  const plan = new URL(request.url).searchParams.get('plan') as PlanId | null;

  if (!userId) {
    return redirectTo('/sign-up/');
  }
  if (!plan || !isPaidPlan(plan)) {
    return redirectTo('/dashboard/');
  }

  const checkoutUrl = await startCheckout(userId, plan);
  return redirectTo(checkoutUrl ?? '/dashboard/settings/billing/');
};
