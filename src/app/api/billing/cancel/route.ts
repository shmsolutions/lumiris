import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { cancelSubscription } from '@/libs/Asaas';
import { notifyPlanCanceled } from '@/libs/Email';
import { getUserProfile, upsertUserProfile } from '@/libs/UserProfile';

/**
 * Cancela a assinatura recorrente no Asaas e derruba o usuário pro Free.
 * O cancelamento no Asaas é best-effort: se a API falhar, o estado local ainda
 * é liberado (o webhook de estorno/cancelamento reconcilia depois, se vier).
 */
export const POST = async () => {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const profile = await getUserProfile(userId);
  await cancelSubscription(profile.asaasSubscriptionId);

  await upsertUserProfile(userId, {
    plan: 'free',
    subscriptionStatus: 'canceled',
    currentPeriodEnd: null,
  });

  await notifyPlanCanceled(userId);

  return NextResponse.json({ ok: true });
};
