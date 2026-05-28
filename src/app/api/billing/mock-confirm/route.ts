import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { isBillingMockMode } from '@/libs/Asaas';
import { markUserPendingPaid } from '@/libs/Payments';
import { upsertUserProfile } from '@/libs/UserProfile';
import { isPaidPlan } from '@/utils/Plans';
import type { PlanId } from '@/utils/Plans';

/** Soma um mês à data atual — fim do ciclo de cobrança simulado. */
const oneMonthFromNow = () => {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  return date;
};

/**
 * Confirmação simulada de pagamento — só existe em modo mock. Libera o plano
 * escolhido na hora pra permitir testar o fluxo sem a chave real do Asaas.
 */
export const GET = async (request: Request) => {
  if (!isBillingMockMode) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const planParam = new URL(request.url).searchParams.get('plan');
  if (!planParam || !isPaidPlan(planParam as PlanId)) {
    return NextResponse.json({ error: 'invalid_plan' }, { status: 422 });
  }

  await upsertUserProfile(userId, {
    plan: planParam as PlanId,
    subscriptionStatus: 'active',
    currentPeriodEnd: oneMonthFromNow(),
  });
  // Sem webhook em modo mock, marcamos as cobranças pendentes como pagas aqui
  // pra o histórico ficar coerente com o plano ativo.
  await markUserPendingPaid(userId);

  // Relative redirect so the browser resolves it against the public domain,
  // not the internal proxy host (0.0.0.0:3000) seen via request.url.
  return new NextResponse(null, {
    status: 302,
    headers: { Location: '/dashboard/settings/billing/?paid=1' },
  });
};
