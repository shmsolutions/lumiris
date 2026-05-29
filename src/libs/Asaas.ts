import { Env } from '@/libs/Env';
import { logger } from '@/libs/Logger';
import { getPlanByValueCents, PLAN_PRICE_CENTS } from '@/utils/Plans';
import type { PaidPlanId, PlanId } from '@/utils/Plans';

const DEFAULT_BASE_URL = 'https://api-sandbox.asaas.com/v3';

const baseUrl = () => (Env.ASAAS_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, '');

const appUrl = () => (Env.NEXT_PUBLIC_APP_URL || 'https://lumiris.com.br').replace(/\/$/, '');

/** Valor do plano em reais (Asaas trabalha com decimal, não centavos). */
const planValueReais = (plan: PaidPlanId) => PLAN_PRICE_CENTS[plan] / 100;

/** Data de hoje no formato yyyy-MM-dd exigido pelo Asaas. */
const today = () => new Date().toISOString().slice(0, 10);

type AsaasFetchInit = {
  method: 'GET' | 'POST' | 'DELETE';
  body?: unknown;
};

/** Faz uma chamada à API do Asaas com o header de autenticação. Lança em erro. */
const asaasFetch = async <T>(path: string, init: AsaasFetchInit): Promise<T> => {
  const url = `${baseUrl()}${path}`;
  logger.info('[billing] Asaas request →', { url, method: init.method });
  const response = await fetch(url, {
    method: init.method,
    headers: {
      'Content-Type': 'application/json',
      access_token: Env.ASAAS_API_KEY as string,
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '<no body>');
    logger.error('[billing] Asaas request failed', {
      url,
      method: init.method,
      status: response.status,
      response: detail || '<empty>',
    });
    throw new Error('asaas_request_failed');
  }

  logger.info('[billing] Asaas response ←', { url, status: response.status });
  return (await response.json()) as T;
};

type AsaasCheckout = { id?: string; link?: string; url?: string; invoiceUrl?: string };

export type CheckoutSession = { checkoutUrl: string };

type CreateCheckoutInput = {
  userId: string;
  plan: PaidPlanId;
};

/**
 * Cria uma sessão de Checkout (página moderna do Asaas) pra uma assinatura
 * mensal. A assinatura só é criada quando o cliente conclui o pagamento — por
 * isso mapeamos o usuário de volta via `externalReference` (userId) no webhook.
 */
export const createCheckout = async (input: CreateCheckoutInput): Promise<CheckoutSession> => {
  const checkout = await asaasFetch<AsaasCheckout>('/checkouts', {
    method: 'POST',
    body: {
      // Asaas: cobrança RECURRENT (cartão na recorrência) só aceita CREDIT_CARD;
      // PIX exigiria DETACHED (avulso) e não existe Pix recorrente.
      billingTypes: ['CREDIT_CARD'],
      chargeTypes: ['RECURRENT'],
      minutesToExpire: 60,
      externalReference: input.userId,
      callback: {
        successUrl: `${appUrl()}/dashboard/settings/?tab=plano&paid=1`,
        cancelUrl: `${appUrl()}/dashboard/settings/?tab=plano`,
      },
      items: [
        {
          name: `Lumiris — plano ${input.plan}`,
          description: `Assinatura mensal do plano ${input.plan}`,
          quantity: 1,
          value: planValueReais(input.plan),
        },
      ],
      subscription: {
        cycle: 'MONTHLY',
        nextDueDate: today(),
        externalReference: input.userId,
      },
      // Sem customerData: o próprio checkout coleta nome/CPF/endereço/telefone
      // do pagador (Asaas exige endereço completo p/ cartão). Mapeamos o usuário
      // pelo externalReference acima.
    },
  });

  // Log temporário da resposta crua — confirmar qual campo traz a URL e o shape
  // no sandbox. Remover depois de validado.
  logger.info('[billing] checkout response (raw)', { checkout });

  const checkoutUrl = checkout.link ?? checkout.url ?? checkout.invoiceUrl;
  if (!checkoutUrl) {
    logger.error('[billing] checkout criado sem URL', { checkout });
    throw new Error('asaas_no_checkout_url');
  }
  logger.info('[billing] checkout criado', { id: checkout.id ?? null, checkoutUrl });
  return { checkoutUrl };
};

/** Cancela a assinatura recorrente no Asaas. Ignora ids inválidos. */
export const cancelSubscription = async (subscriptionId: string | null): Promise<void> => {
  if (!subscriptionId?.startsWith('sub_')) {
    return;
  }
  await asaasFetch(`/subscriptions/${subscriptionId}`, { method: 'DELETE' }).catch(
    (error: unknown) => {
      // Não bloqueia o cancelamento local se o Asaas falhar — apenas registra.
      logger.error(
        `Falha ao cancelar assinatura ${subscriptionId} no Asaas: ${(error as Error).message}`,
      );
    },
  );
};

/** Eventos do Asaas que nos interessam pra liberar/expirar plano. */
export type BillingEvent = {
  /** 'paid' libera/renova; 'canceled' derruba pro free; 'past_due' marca atraso. */
  kind: 'paid' | 'canceled' | 'past_due' | 'unknown';
  /** id da cobrança (pay_xxx). */
  paymentId: string | null;
  /** id da assinatura (sub_xxx) — usado pra mapear o usuário (fluxo legado). */
  subscriptionId: string | null;
  /** id do cliente no Asaas (cus_xxx). */
  customerId: string | null;
  /** Nosso userId, propagado via externalReference no checkout. */
  externalReference: string | null;
  plan: PlanId | null;
};

type AsaasWebhookPayment = {
  id?: string;
  value?: number;
  subscription?: string;
  customer?: string;
  externalReference?: string;
};

type AsaasWebhookPayload = {
  event?: string;
  payment?: AsaasWebhookPayment;
};

const PAID_EVENTS = new Set(['PAYMENT_CONFIRMED', 'PAYMENT_RECEIVED']);
const CANCELED_EVENTS = new Set([
  'PAYMENT_REFUNDED',
  'PAYMENT_CHARGEBACK_REQUESTED',
  'PAYMENT_DELETED',
]);

/**
 * Interpreta o corpo do webhook do Asaas, extraindo assinatura e plano.
 * O plano é inferido pelo valor cobrado; o usuário é mapeado depois pela
 * assinatura (subscription id).
 */
export const parseWebhookEvent = (raw: unknown): BillingEvent => {
  const payload = (raw ?? {}) as AsaasWebhookPayload;
  const event = payload.event ?? '';
  const payment = payload.payment ?? {};
  const valueCents = Math.round((payment.value ?? 0) * 100);

  const base = {
    paymentId: payment.id ?? null,
    subscriptionId: payment.subscription ?? null,
    customerId: payment.customer ?? null,
    externalReference: payment.externalReference ?? null,
    plan: getPlanByValueCents(valueCents),
  };

  if (PAID_EVENTS.has(event)) {
    return { kind: 'paid', ...base };
  }
  if (CANCELED_EVENTS.has(event)) {
    return { kind: 'canceled', ...base };
  }
  if (event === 'PAYMENT_OVERDUE') {
    return { kind: 'past_due', ...base };
  }
  return { kind: 'unknown', ...base };
};

/**
 * Valida o webhook pelo token compartilhado (header asaas-access-token).
 * Sem token configurado: em produção rejeita; em dev aceita e avisa.
 */
export const verifyWebhookToken = (token: string | null): boolean => {
  const expected = Env.ASAAS_WEBHOOK_TOKEN;
  if (!expected) {
    if (Env.NODE_ENV === 'production') {
      logger.error('ASAAS_WEBHOOK_TOKEN ausente em produção — webhook rejeitado');
      return false;
    }
    logger.warn('ASAAS_WEBHOOK_TOKEN ausente — webhook aceito sem validação (dev)');
    return true;
  }
  return token === expected;
};
