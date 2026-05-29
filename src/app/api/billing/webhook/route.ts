import { NextResponse } from 'next/server';
import { cancelSubscription, parseWebhookEvent, verifyWebhookToken } from '@/libs/Asaas';
import { notifyPlanActivated, notifyPlanCanceled } from '@/libs/Email';
import { logger } from '@/libs/Logger';
import { markPaymentCanceled, recordPayment } from '@/libs/Payments';
import {
  getUserIdByAsaasSubscription,
  getUserProfile,
  upsertUserProfile,
} from '@/libs/UserProfile';
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

  // Log temporário — acompanhar o mapeamento no sandbox. Remover depois.
  logger.info('[billing] webhook event', {
    kind: event.kind,
    plan: event.plan,
    externalReference: event.externalReference,
    subscriptionId: event.subscriptionId,
    customerId: event.customerId,
    paymentId: event.paymentId,
  });

  // Mapeia o usuário: preferimos o externalReference (userId) propagado pelo
  // Checkout; caímos pra subscriptionId no fluxo legado de assinatura direta.
  const userId =
    event.externalReference ??
    (event.subscriptionId ? await getUserIdByAsaasSubscription(event.subscriptionId) : null);
  if (!userId) {
    return NextResponse.json({ ok: true });
  }

  try {
    if (event.kind === 'paid' && event.plan && event.plan !== 'free') {
      // Upgrade/downgrade: cancela a assinatura anterior (se for outra) pra não
      // cobrar em duplicidade quando o usuário troca de plano.
      const profile = await getUserProfile(userId);
      if (
        event.subscriptionId &&
        profile.asaasSubscriptionId &&
        profile.asaasSubscriptionId !== event.subscriptionId
      ) {
        await cancelSubscription(profile.asaasSubscriptionId);
        logger.info(`Assinatura anterior ${profile.asaasSubscriptionId} cancelada (upgrade)`);
      }
      await upsertUserProfile(userId, {
        plan: event.plan,
        subscriptionStatus: 'active',
        currentPeriodEnd: oneMonthFromNow(),
        // Guarda ids do Asaas vindos do checkout pra cancelamento/futuros webhooks.
        ...(event.subscriptionId ? { asaasSubscriptionId: event.subscriptionId } : {}),
        ...(event.customerId ? { asaasCustomerId: event.customerId } : {}),
      });
      if (event.paymentId && event.subscriptionId) {
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
