import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import * as z from 'zod';
import { logger } from '@/libs/Logger';
import { upsertUserProfile } from '@/libs/UserProfile';
import { createCharge } from '@/libs/Woovi';
import type { CheckoutResult } from '@/libs/Woovi';
import { isPaidPlan } from '@/utils/Plans';
import type { PaidPlanId, PlanId } from '@/utils/Plans';
import { CheckoutValidation } from '@/validations/BillingValidation';

/** Woovi statuses that mean "this charge was already paid". */
const PAID_STATUSES = new Set(['COMPLETED', 'CONFIRMED', 'PAID']);
const isAlreadyPaid = (status: string) => PAID_STATUSES.has(status.toUpperCase());

const oneMonthFromNow = () => {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  return date;
};

/**
 * Cria/recupera a cobrança no Woovi e marca a assinatura como pendente.
 * Devolve o resultado bruto (com status e URL) pra quem chamou decidir
 * se mostra o checkout ou reconcilia um pagamento já feito.
 */
const startCheckout = async (userId: string, plan: PaidPlanId): Promise<CheckoutResult | null> => {
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

  return charge;
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

  const result = await startCheckout(userId, parse.data.plan);
  if (!result) {
    return NextResponse.json({ error: 'checkout_failed' }, { status: 502 });
  }

  return NextResponse.json({ checkoutUrl: result.checkoutUrl, status: result.status });
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

  const result = await startCheckout(userId, plan);
  if (!result) {
    return redirectTo('/dashboard/settings/billing/');
  }

  // The user already paid this charge — webhook clearly didn't reconcile
  // (network, signature, missing setup). Activate the plan now and send
  // them to the billing page, instead of dumping them on the Woovi paid
  // receipt page again.
  if (isAlreadyPaid(result.status)) {
    await upsertUserProfile(userId, {
      plan,
      subscriptionStatus: 'active',
      currentPeriodEnd: oneMonthFromNow(),
    });
    return redirectTo('/dashboard/settings/billing/?paid=1');
  }

  return redirectTo(result.checkoutUrl);
};
