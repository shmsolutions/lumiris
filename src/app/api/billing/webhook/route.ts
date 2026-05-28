import { NextResponse } from 'next/server';
import { parseWebhookEvent, verifyWebhookToken } from '@/libs/Asaas';
import { notifyPlanActivated, notifyPlanCanceled } from '@/libs/Email';
import { logger } from '@/libs/Logger';
import { markPaymentCanceled, recordPayment } from '@/libs/Payments';
import { getUserIdByAsaasSubscription, upsertUserProfile } from '@/libs/UserProfile';
import { PLAN_PRICE_CENTS } from '@/utils/Plans';

/** Soma um mês à data atual — fim do ciclo de cobrança. */
const oneMonthFromNow = () => {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  return date;
};

const parseBody = (rawBody: string): unknown => {
  try {
    return JSON.parse(rawBody || '{}');
  } catch {
    return {};
  }
};

export const POST = async (request: Request) => {
  const rawBody = await request.text();
  const token = request.headers.get('asaas-access-token');

  if (!verifyWebhookToken(token)) {
    logger.warn('Asaas webhook com token inválido — ignorado');
    return NextResponse.json({ error: 'invalid_token' }, { status: 401 });
  }

  const event = parseWebhookEvent(parseBody(rawBody));

  // Sem assinatura no payload (ex: cobrança avulsa/teste) não há o que liberar.
  if (!event.subscriptionId) {
    return NextResponse.json({ ok: true });
  }

  const userId = await getUserIdByAsaasSubscription(event.subscriptionId);
  if (!userId) {
    return NextResponse.json({ ok: true });
  }

  try {
    if (event.kind === 'paid' && event.plan && event.plan !== 'free') {
      await upsertUserProfile(userId, {
        plan: event.plan,
        subscriptionStatus: 'active',
        currentPeriodEnd: oneMonthFromNow(),
      });
      if (event.paymentId) {
        await recordPayment({
          ownerId: userId,
          correlationId: event.paymentId,
          asaasSubscriptionId: event.subscriptionId,
          plan: event.plan,
          valueCents: PLAN_PRICE_CENTS[event.plan],
          paymentLinkUrl: null,
          status: 'paid',
        });
      }
      logger.info(`Plano ${event.plan} liberado para ${userId} via Asaas`);
      await notifyPlanActivated(userId, event.plan);
    } else if (event.kind === 'past_due') {
      await upsertUserProfile(userId, { subscriptionStatus: 'past_due' });
      logger.info(`Pagamento em atraso para ${userId} — assinatura marcada past_due`);
    } else if (event.kind === 'canceled') {
      await upsertUserProfile(userId, { plan: 'free', subscriptionStatus: 'canceled' });
      if (event.paymentId) {
        await markPaymentCanceled(event.paymentId);
      }
      logger.info(`Assinatura cancelada/estornada para ${userId} — voltou pro free`);
      await notifyPlanCanceled(userId);
    }
  } catch (error) {
    // Não estoura 500: loga e devolve 200 pra evitar retentativas em loop.
    logger.error(`Erro ao processar webhook Asaas ${userId}: ${(error as Error).message}`);
  }

  return NextResponse.json({ ok: true });
};
