import { NextResponse } from 'next/server';
import { cancelSubscription, parseWebhookEvent, verifyWebhookToken } from '@/libs/Asaas';
import { notifyPlanActivated, notifyPlanCanceled } from '@/libs/Email';
import { logger } from '@/libs/Logger';
import { markPaymentCanceled, recordPayment } from '@/libs/Payments';
import {
  getUserIdByAsaasCheckout,
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
    checkoutId: event.checkoutId,
    subscriptionId: event.subscriptionId,
    customerId: event.customerId,
    paymentId: event.paymentId,
  });

  // Mapeia o usuário: externalReference (quando o Asaas propaga) → sessão de
  // checkout (caso do checkout, que não devolve externalReference no pagamento)
  // → subscriptionId (fluxo legado de assinatura direta).
  const userId =
    event.externalReference ??
    (event.checkoutId ? await getUserIdByAsaasCheckout(event.checkoutId) : null) ??
    (event.subscriptionId ? await getUserIdByAsaasSubscription(event.subscriptionId) : null);
  if (!userId) {
    return NextResponse.json({ ok: true });
  }

  try {
    if (event.kind === 'paid' && event.plan && event.plan !== 'free') {
      const profile = await getUserProfile(userId);
      const previousSubscriptionId = profile.asaasSubscriptionId;

      // 1) Ativa o plano novo PRIMEIRO (e zera a sessão de checkout consumida),
      // pra que um eventual webhook de cancelamento da assinatura antiga não
      // ache este perfil como "assinatura atual".
      await upsertUserProfile(userId, {
        plan: event.plan,
        subscriptionStatus: 'active',
        currentPeriodEnd: oneMonthFromNow(),
        asaasCheckoutId: null,
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

      // 2) Upgrade: cancela a assinatura anterior (se for outra) pra não cobrar 2x.
      if (
        event.subscriptionId &&
        previousSubscriptionId &&
        previousSubscriptionId !== event.subscriptionId
      ) {
        await cancelSubscription(previousSubscriptionId);
        logger.info(`Assinatura anterior ${previousSubscriptionId} cancelada (upgrade)`);
      }

      logger.info(`Plano ${event.plan} liberado para ${userId} via Asaas`);
      await notifyPlanActivated(userId, event.plan);
    } else if (event.kind === 'past_due') {
      await upsertUserProfile(userId, { subscriptionStatus: 'past_due' });
      logger.info(`Pagamento em atraso para ${userId} — assinatura marcada past_due`);
    } else if (event.kind === 'canceled') {
      // Só derruba pro free se for a assinatura ATUAL. Ignora o cancelamento da
      // assinatura antiga disparado por um upgrade (senão zera o plano novo).
      const profile = await getUserProfile(userId);
      if (
        event.subscriptionId &&
        profile.asaasSubscriptionId &&
        event.subscriptionId !== profile.asaasSubscriptionId
      ) {
        logger.info(`Cancelamento da assinatura antiga ${event.subscriptionId} ignorado (upgrade)`);
      } else {
        await upsertUserProfile(userId, { plan: 'free', subscriptionStatus: 'canceled' });
        if (event.paymentId) {
          await markPaymentCanceled(event.paymentId);
        }
        logger.info(`Assinatura cancelada/estornada para ${userId} — voltou pro free`);
        await notifyPlanCanceled(userId);
      }
    }
  } catch (error) {
    // Não estoura 500: loga e devolve 200 pra evitar retentativas em loop.
    logger.error(`Erro ao processar webhook Asaas ${userId}: ${(error as Error).message}`);
  }

  return NextResponse.json({ ok: true });
};
