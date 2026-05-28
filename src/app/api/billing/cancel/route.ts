import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { upsertUserProfile } from '@/libs/UserProfile';

/**
 * Cancela o plano do usuário: derruba pro Free imediatamente. Como a cobrança
 * no Woovi é avulsa (não recorrente automática), não há recorrência a desligar
 * — basta liberar o estado local. Se um dia adotarmos recorrência de verdade,
 * aqui também desativaríamos a assinatura no Woovi.
 */
export const POST = async () => {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  await upsertUserProfile(userId, {
    plan: 'free',
    subscriptionStatus: 'canceled',
    currentPeriodEnd: null,
  });

  return NextResponse.json({ ok: true });
};
