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

export type CheckoutSession = { checkoutUrl: string; checkoutId: string | null };

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
  return { checkoutUrl, checkoutId: checkout.id ?? null };
};

type AsaasCustomer = { id: string };

/** Cria (ou reaproveita) o cliente no Asaas e devolve o id (cus_xxx). */
const ensureCustomer = async (input: {
  userId: string;
  name: string;
  email: string;
  taxId: string;
  existingCustomerId: string | null;
}): Promise<string> => {
  if (input.existingCustomerId?.startsWith('cus_')) {
    return input.existingCustomerId;
  }
  const customer = await asaasFetch<AsaasCustomer>('/customers', {
    method: 'POST',
    body: {
      name: input.name,
      cpfCnpj: input.taxId,
      email: input.email,
      externalReference: input.userId,
      notificationDisabled: false,
    },
  });
  return customer.id;
};

type AsaasSubscription = { id: string };
type AsaasPaymentList = { data?: { id: string }[] };
type AsaasPixQr = { encodedImage?: string; payload?: string; expirationDate?: string };

export type PixCharge = {
  subscriptionId: string;
  customerId: string;
  /** PNG do QR Code em base64 (sem o prefixo data:). */
  qrImage: string;
  /** Código copia-e-cola do Pix. */
  qrPayload: string;
  expiresAt: string | null;
};

/**
 * Cria uma assinatura mensal cobrada por Pix e devolve o QR da primeira
 * cobrança. Pix não é débito automático: a cada ciclo o Asaas gera um novo Pix
 * e lembra o cliente. Mapeamos o usuário pela subscriptionId no webhook.
 */
export const createPixSubscription = async (input: {
  userId: string;
  plan: PaidPlanId;
  customerId: string;
}): Promise<PixCharge> => {
  const subscription = await asaasFetch<AsaasSubscription>('/subscriptions', {
    method: 'POST',
    body: {
      customer: input.customerId,
      billingType: 'PIX',
      value: planValueReais(input.plan),
      nextDueDate: today(),
      cycle: 'MONTHLY',
      description: `Lumiris — plano ${input.plan}`,
      externalReference: input.userId,
    },
  });

  const payments = await asaasFetch<AsaasPaymentList>(
    `/subscriptions/${subscription.id}/payments`,
    { method: 'GET' },
  );
  const firstPaymentId = payments.data?.[0]?.id;
  if (!firstPaymentId) {
    throw new Error('asaas_no_pix_payment');
  }

  const qr = await asaasFetch<AsaasPixQr>(`/payments/${firstPaymentId}/pixQrCode`, {
    method: 'GET',
  });
  if (!(qr.encodedImage && qr.payload)) {
    throw new Error('asaas_no_pix_qr');
  }

  return {
    subscriptionId: subscription.id,
    customerId: input.customerId,
    qrImage: qr.encodedImage,
    qrPayload: qr.payload,
    expiresAt: qr.expirationDate ?? null,
  };
};

/** Cria assinatura Pix garantindo o cliente. Conveniência usada pela rota. */
export const startPixSubscription = async (input: {
  userId: string;
  plan: PaidPlanId;
  customer: { name: string; email: string; taxId: string };
  existingCustomerId: string | null;
}): Promise<PixCharge> => {
  const customerId = await ensureCustomer({
    userId: input.userId,
    name: input.customer.name,
    email: input.customer.email,
    taxId: input.customer.taxId,
    existingCustomerId: input.existingCustomerId,
  });
  return await createPixSubscription({ userId: input.userId, plan: input.plan, customerId });
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
  /** Sessão de checkout que originou o pagamento — mapeia de volta pro usuário. */
  checkoutId: string | null;
  /** Nosso userId, propagado via externalReference (quando o Asaas propaga). */
  externalReference: string | null;
  plan: PlanId | null;
};

type AsaasWebhookPayment = {
  id?: string;
  value?: number;
  subscription?: string;
  customer?: string;
  checkoutSession?: string;
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
    checkoutId: payment.checkoutSession ?? null,
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
