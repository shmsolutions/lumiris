import { createVerify } from 'node:crypto';
import { Env } from '@/libs/Env';
import { logger } from '@/libs/Logger';
import { getPlanByValueCents, PLAN_PRICE_CENTS } from '@/utils/Plans';
import type { PaidPlanId, PlanId } from '@/utils/Plans';

const DEFAULT_BASE_URL = 'https://api.woovi.com';
const CORRELATION_PREFIX = 'lume_';

/**
 * Sem App ID configurado (ou mock explícito) rodamos em modo simulado: o
 * checkout devolve uma URL local que confirma o pagamento, permitindo testar o
 * fluxo de ponta a ponta antes de plugar a chave real do Woovi.
 */
export const isBillingMockMode = Env.LUME_BILLING_MOCK || !Env.WOOVI_APP_ID;

/** correlationID determinístico por usuário — usado pra mapear o webhook de volta. */
export const correlationIdFor = (userId: string) => `${CORRELATION_PREFIX}${userId}`;

/** Extrai o userId de um correlationID nosso; null se não for um. */
export const userIdFromCorrelationId = (correlationId: string | null | undefined): string | null =>
  correlationId?.startsWith(CORRELATION_PREFIX)
    ? correlationId.slice(CORRELATION_PREFIX.length)
    : null;

type SubscriptionCustomer = {
  name: string;
  email: string;
};

export type CreateSubscriptionResult = {
  subscriptionId: string;
  checkoutUrl: string;
  status: string;
};

const baseUrl = () => (Env.WOOVI_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, '');

/**
 * Cria uma assinatura recorrente (Pix) no Woovi e devolve a URL de checkout.
 * Em modo mock devolve uma URL local que confirma o pagamento na hora.
 */
export const createSubscription = async (input: {
  userId: string;
  plan: PaidPlanId;
  customer: SubscriptionCustomer;
}): Promise<CreateSubscriptionResult> => {
  const correlationID = correlationIdFor(input.userId);
  const value = PLAN_PRICE_CENTS[input.plan];

  if (isBillingMockMode) {
    return {
      subscriptionId: `mock_${input.plan}_${input.userId}`,
      checkoutUrl: `/api/billing/mock-confirm?plan=${input.plan}`,
      status: 'mock',
    };
  }

  const response = await fetch(`${baseUrl()}/api/v1/subscriptions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: Env.WOOVI_APP_ID as string,
    },
    body: JSON.stringify({
      value,
      customer: { name: input.customer.name, email: input.customer.email },
      correlationID,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    logger.error(`Woovi createSubscription failed: status=${response.status} body=${detail}`);
    throw new Error('woovi_subscription_failed');
  }

  const data = (await response.json()) as WooviSubscriptionResponse;
  const subscription = data.subscription ?? data;
  const checkoutUrl = extractCheckoutUrl(data);

  if (!checkoutUrl) {
    logger.error(`Woovi subscription created without checkout URL: ${JSON.stringify(data)}`);
    throw new Error('woovi_no_checkout_url');
  }

  return {
    subscriptionId: subscription.globalID ?? subscription.id ?? correlationID,
    checkoutUrl,
    status: subscription.status ?? 'pending',
  };
};

type WooviCharge = {
  paymentLinkUrl?: string;
  globalID?: string;
  id?: string;
  status?: string;
  value?: number;
  correlationID?: string;
};

type WooviSubscription = {
  globalID?: string;
  id?: string;
  status?: string;
  value?: number;
  correlationID?: string;
};

type WooviSubscriptionResponse = WooviSubscription & {
  subscription?: WooviSubscription;
  charge?: WooviCharge;
  paymentLinkUrl?: string;
};

const extractCheckoutUrl = (data: WooviSubscriptionResponse): string | null =>
  data.charge?.paymentLinkUrl ?? data.paymentLinkUrl ?? null;

/** Eventos do Woovi que nos interessam pra liberar/cancelar plano. */
export type BillingEvent = {
  /** 'paid' libera o plano; 'canceled'/'expired' derruba pro free. */
  kind: 'paid' | 'canceled' | 'unknown';
  userId: string | null;
  plan: PlanId | null;
};

type WooviWebhookPayload = {
  event?: string;
  charge?: WooviCharge;
  subscription?: WooviSubscription;
  pixQrCode?: unknown;
};

/**
 * Interpreta o corpo do webhook do Woovi, extraindo usuário e plano.
 * O plano é inferido pelo valor cobrado; o usuário pelo correlationID.
 */
export const parseWebhookEvent = (raw: unknown): BillingEvent => {
  const payload = (raw ?? {}) as WooviWebhookPayload;
  const event = payload.event ?? '';
  const correlationID = payload.charge?.correlationID ?? payload.subscription?.correlationID;
  const userId = userIdFromCorrelationId(correlationID);
  const valueCents = payload.charge?.value ?? payload.subscription?.value ?? 0;
  const plan = getPlanByValueCents(valueCents);

  if (event.includes('COMPLETED') || event.includes('CONFIRMED') || event.includes('RECEIVED')) {
    return { kind: 'paid', userId, plan };
  }
  if (event.includes('EXPIRED') || event.includes('CANCEL') || event.includes('DELETE')) {
    return { kind: 'canceled', userId, plan };
  }
  return { kind: 'unknown', userId, plan };
};

/**
 * Valida a assinatura do webhook contra a chave pública do Woovi (RSA-SHA256).
 * Sem chave configurada, aceita (modo dev) e registra um aviso.
 */
export const verifyWebhookSignature = (rawBody: string, signature: string | null): boolean => {
  const publicKey = Env.WOOVI_WEBHOOK_PUBLIC_KEY;
  if (!publicKey) {
    logger.warn('WOOVI_WEBHOOK_PUBLIC_KEY ausente — webhook aceito sem validação de assinatura');
    return true;
  }
  if (!signature) {
    return false;
  }
  const verifier = createVerify('RSA-SHA256');
  verifier.update(rawBody);
  verifier.end();
  return verifier.verify(publicKey, signature, 'base64');
};
