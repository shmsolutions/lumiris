import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import * as z from 'zod';
import { createCheckout } from '@/libs/Asaas';
import { logger } from '@/libs/Logger';
import { getUserProfile, upsertUserProfile } from '@/libs/UserProfile';
import { isPaidPlan } from '@/utils/Plans';
import type { PaidPlanId, PlanId } from '@/utils/Plans';
import { CheckoutValidation } from '@/validations/BillingValidation';

const startCheckout = async (userId: string, plan: PaidPlanId, taxId: string) => {
  const profile = await getUserProfile(userId);
  const user = await currentUser().catch(() => null);
  const name =
    profile.therapistName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() ||
    'Terapeuta Lumiris';
  const email = user?.primaryEmailAddress?.emailAddress ?? '';

  const result = await createCheckout({
    userId,
    plan,
    customer: { name, email, taxId },
  }).catch((error: unknown) => {
    logger.error(`Checkout failed for ${userId}: ${(error as Error).message}`);
    return null;
  });

  if (!result) {
    return null;
  }

  // Guardamos o CPF/CNPJ e marcamos pendente; assinatura/cliente são
  // capturados no webhook quando o pagamento conclui.
  await upsertUserProfile(userId, { taxId, subscriptionStatus: 'pending' });
  return result;
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

  const result = await startCheckout(userId, parse.data.plan, parse.data.taxId);
  if (!result) {
    return NextResponse.json({ error: 'checkout_failed' }, { status: 502 });
  }

  return NextResponse.json({ checkoutUrl: result.checkoutUrl });
};

/**
 * Entry point for the marketing pricing CTA, which is a plain link (the landing
 * page has no Clerk context). Logged-out visitors go to sign-up; logged-in ones
 * are sent to the billing page with the plan preselected — the subscription
 * needs a CPF/CNPJ, collected there.
 */
// A relative Location lets the browser resolve it against the public domain it
// requested; building an absolute URL from request.url would leak the internal
// proxy host behind the reverse proxy.
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
  return redirectTo('/dashboard/settings/?tab=plano');
};
