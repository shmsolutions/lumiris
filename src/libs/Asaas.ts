import { Env } from '@/libs/Env';
import { logger } from '@/libs/Logger';
import { getPlanByValueCents, PLAN_PRICE_CENTS } from '@/utils/Plans';
import type { PaidPlanId, PlanId } from '@/utils/Plans';

const DEFAULT_BASE_URL = 'https://api-sandbox.asaas.com/v3';

/**
 * Sem chave da API (ou mock explícito) rodamos em modo simulado: o checkout
 * devolve uma URL local que confirma o pagamento, permitindo testar o fluxo
 * de ponta a ponta antes de plugar a chave real do Asaas.
 */
export const isBillingMockMode = Env.LUME_BILLING_MOCK || !Env.ASAAS_API_KEY;

const baseUrl = () => (Env.ASAAS_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, '');

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
  const response = await fetch(`${baseUrl()}${path}`, {
    method: init.method,
    headers: {
      'Content-Type': 'application/json',
      access_token: Env.ASAAS_API_KEY as string,
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '<no body>');
    logger.error('Asaas request failed', {
      path,
      method: init.method,
      status: response.status,
      response: detail || '<empty>',
    });
    throw new Error('asaas_request_failed');
  }

  return (await response.json()) as T;
};

type AsaasCustomer = { id: string };
type AsaasSubscription = { id: string; status?: string };
type AsaasPayment = { id: string; invoiceUrl?: string; value?: number; status?: string };
type AsaasPaymentList = { data?: AsaasPayment[] };

export type CheckoutResult = {
  customerId: string;
  subscriptionId: string;
  /** id da cobrança gerada (pay_xxx) — chave pra persistir e mapear o webhook. */
  paymentId: string;
  /** Página hospedada do Asaas onde o cliente escolhe Pix/cartão/boleto. */
  invoiceUrl: string;
  status: string;
};

type SubscribeInput = {
  userId: string;
  plan: PaidPlanId;
  customer: { name: string; email: string; taxId: string };
  /** Reaproveita um cliente já criado no Asaas, se houver. */
  existingCustomerId: string | null;
};

/** Cria (ou reaproveita) o cliente no Asaas e devolve o id. */
const ensureCustomer = async (input: SubscribeInput): Promise<string> => {
  if (input.existingCustomerId) {
    return input.existingCustomerId;
  }
  const customer = await asaasFetch<AsaasCustomer>('/customers', {
    method: 'POST',
    body: {
      name: input.customer.name,
      cpfCnpj: input.customer.taxId,
      email: input.customer.email,
      externalReference: input.userId,
      notificationDisabled: false,
    },
  });
  return customer.id;
};

/**
 * Cria uma assinatura recorrente mensal no Asaas com billingType UNDEFINED — o
 * cliente escolhe Pix, cartão ou boleto na página hospedada. Em modo mock,
 * devolve uma URL local que confirma o pagamento na hora.
 */
export const subscribe = async (input: SubscribeInput): Promise<CheckoutResult> => {
  if (isBillingMockMode) {
    return {
      customerId: `mock_cus_${input.userId}`,
      subscriptionId: `mock_sub_${input.plan}`,
      paymentId: `mock_pay_${input.plan}_${Date.now().toString(36)}`,
      invoiceUrl: `/api/billing/mock-confirm?plan=${input.plan}`,
      status: 'mock',
    };
  }

  const customerId = await ensureCustomer(input);

  const subscription = await asaasFetch<AsaasSubscription>('/subscriptions', {
    method: 'POST',
    body: {
      customer: customerId,
      billingType: 'UNDEFINED',
      value: planValueReais(input.plan),
      nextDueDate: today(),
      cycle: 'MONTHLY',
      description: `Lumiris — plano ${input.plan}`,
      externalReference: input.userId,
    },
  });

  // A primeira cobrança é criada logo após a assinatura, então buscamos a lista
  // de pagamentos pra pegar a URL de checkout.
  const payments = await asaasFetch<AsaasPaymentList>(
    `/subscriptions/${subscription.id}/payments`,
    { method: 'GET' },
  );
  const firstPayment = payments.data?.[0];
  if (!firstPayment?.invoiceUrl) {
    logger.error('Asaas subscription created without invoice URL', {
      subscriptionId: subscription.id,
    });
    throw new Error('asaas_no_invoice_url');
  }

  return {
    customerId,
    subscriptionId: subscription.id,
    paymentId: firstPayment.id,
    invoiceUrl: firstPayment.invoiceUrl,
    status: firstPayment.status ?? 'PENDING',
  };
};

/** Cancela a assinatura recorrente no Asaas. Silencioso em modo mock. */
export const cancelSubscription = async (subscriptionId: string | null): Promise<void> => {
  if (isBillingMockMode || !subscriptionId || subscriptionId.startsWith('mock_')) {
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
  /** id da assinatura (sub_xxx) — usado pra mapear o usuário. */
  subscriptionId: string | null;
  plan: PlanId | null;
};

type AsaasWebhookPayment = {
  id?: string;
  value?: number;
  subscription?: string;
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
 * Sem token configurado: em produção real rejeita; em dev/mock aceita e avisa.
 */
export const verifyWebhookToken = (token: string | null): boolean => {
  const expected = Env.ASAAS_WEBHOOK_TOKEN;
  if (!expected) {
    if (Env.NODE_ENV === 'production' && !isBillingMockMode) {
      logger.error('ASAAS_WEBHOOK_TOKEN ausente em produção — webhook rejeitado');
      return false;
    }
    logger.warn('ASAAS_WEBHOOK_TOKEN ausente — webhook aceito sem validação (dev/mock)');
    return true;
  }
  return token === expected;
};
