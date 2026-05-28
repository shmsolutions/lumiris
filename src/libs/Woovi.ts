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

type CheckoutCustomer = {
  name: string;
  email: string;
};

export type CheckoutResult = {
  chargeId: string;
  checkoutUrl: string;
  status: string;
};

type WooviCharge = {
  paymentLinkUrl?: string;
  globalID?: string;
  id?: string;
  status?: string;
  value?: number;
  correlationID?: string;
};

type WooviChargeResponse = WooviCharge & {
  charge?: WooviCharge;
  paymentLinkUrl?: string;
};

const baseUrl = () => (Env.WOOVI_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, '');

const extractCheckoutUrl = (data: WooviChargeResponse): string | null =>
  data.charge?.paymentLinkUrl ?? data.paymentLinkUrl ?? null;

/**
 * Busca uma cobrança existente pelo correlationID e devolve seu checkout.
 * Usado quando o create falha com 400 por já existir uma charge com o mesmo id.
 */
const fetchExistingCharge = async (correlationID: string): Promise<CheckoutResult | null> => {
  const response = await fetch(`${baseUrl()}/api/v1/charge/${correlationID}`, {
    headers: { Authorization: Env.WOOVI_APP_ID as string },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '<no body>');
    logger.error('Woovi getCharge failed', { status: response.status, response: body });
    return null;
  }

  const data = (await response.json()) as WooviChargeResponse;
  const charge = data.charge ?? data;
  const checkoutUrl = extractCheckoutUrl(data);
  if (!checkoutUrl) {
    logger.error('Woovi existing charge has no payment link', { data: JSON.stringify(data) });
    return null;
  }

  return {
    chargeId: charge.globalID ?? charge.id ?? correlationID,
    checkoutUrl,
    status: charge.status ?? 'pending',
  };
};

/**
 * Cria uma cobrança (Pix) no Woovi e devolve a URL de checkout com o link de
 * pagamento. O charge é idempotente no correlationID: reenviar com o mesmo id
 * devolve a cobrança existente, então não há erro de duplicado. Em modo mock
 * devolve uma URL local que confirma o pagamento na hora.
 */
export const createCharge = async (input: {
  userId: string;
  plan: PaidPlanId;
  customer: CheckoutCustomer;
}): Promise<CheckoutResult> => {
  const correlationID = correlationIdFor(input.userId);
  const value = PLAN_PRICE_CENTS[input.plan];

  if (isBillingMockMode) {
    return {
      chargeId: `mock_${input.plan}_${input.userId}`,
      checkoutUrl: `/api/billing/mock-confirm?plan=${input.plan}`,
      status: 'mock',
    };
  }

  const url = `${baseUrl()}/api/v1/charge`;
  const payload = {
    correlationID,
    value,
    comment: `Lumiris - plano ${input.plan}`,
    customer: { name: input.customer.name, email: input.customer.email },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: Env.WOOVI_APP_ID as string,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '<no body>');

    // The charge already exists for this correlationID — fetch it and reuse
    // its payment link instead of failing (matches both pt "Correlação" and
    // any future English variant).
    if (response.status === 400 && body.toLowerCase().includes('correla')) {
      const existing = await fetchExistingCharge(correlationID);
      if (existing) {
        return existing;
      }
    }

    // Pass details as structured properties — logtape eats literal `{}` in the
    // message template, which mangles JSON embedded in the string.
    logger.error('Woovi createCharge failed', {
      status: response.status,
      statusText: response.statusText,
      url,
      appIdPresent: Boolean(Env.WOOVI_APP_ID),
      payload,
      response: body || '<empty>',
    });
    throw new Error('woovi_charge_failed');
  }

  const data = (await response.json()) as WooviChargeResponse;
  const charge = data.charge ?? data;
  const checkoutUrl = extractCheckoutUrl(data);

  if (!checkoutUrl) {
    logger.error('Woovi charge created without payment link', { data: JSON.stringify(data) });
    throw new Error('woovi_no_checkout_url');
  }

  return {
    chargeId: charge.globalID ?? charge.id ?? correlationID,
    checkoutUrl,
    status: charge.status ?? 'pending',
  };
};

type WooviSubscription = {
  globalID?: string;
  id?: string;
  status?: string;
  value?: number;
  correlationID?: string;
};

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
 * Aceita um PEM em qualquer formato que tenha sobrevivido a um campo de env:
 * quebras reais, `\n` literais (Vercel/Coolify), ou tudo numa linha só com
 * espaços (cole-direto sem escape). Reconstrói o bloco PEM canônico.
 */
const normalizePem = (raw: string): string => {
  const withNewlines = raw.includes('\\n') ? raw.replaceAll('\\n', '\n') : raw;
  if (withNewlines.includes('\n')) {
    return withNewlines;
  }
  // Single-line PEM (Coolify-style): reconstrói os blocos a 64 chars por linha.
  const match = withNewlines.match(/-----BEGIN ([A-Z ]+)-----\s*(.+?)\s*-----END \1-----/);
  if (!match) {
    return withNewlines;
  }
  const [, type, base64] = match;
  const body =
    (base64 ?? '')
      .replaceAll(/\s+/g, '')
      .match(/.{1,64}/g)
      ?.join('\n') ?? base64;
  return `-----BEGIN ${type}-----\n${body}\n-----END ${type}-----`;
};

/**
 * Valida a assinatura do webhook contra a chave pública do Woovi (RSA-SHA256).
 * Em produção real (não-mock), a chave é obrigatória: sem ela, rejeita. Em
 * dev/mock, aceita sem validar e registra um aviso.
 */
export const verifyWebhookSignature = (rawBody: string, signature: string | null): boolean => {
  const rawKey = Env.WOOVI_WEBHOOK_PUBLIC_KEY;
  if (!rawKey) {
    if (Env.NODE_ENV === 'production' && !isBillingMockMode) {
      logger.error('WOOVI_WEBHOOK_PUBLIC_KEY ausente em produção — webhook rejeitado');
      return false;
    }
    logger.warn('WOOVI_WEBHOOK_PUBLIC_KEY ausente — webhook aceito sem validação (dev/mock)');
    return true;
  }
  if (!signature) {
    return false;
  }
  const publicKey = normalizePem(rawKey);
  try {
    const verifier = createVerify('RSA-SHA256');
    verifier.update(rawBody);
    verifier.end();
    return verifier.verify(publicKey, signature, 'base64');
  } catch (error) {
    logger.error(`Falha ao validar assinatura do webhook Woovi: ${(error as Error).message}`);
    return false;
  }
};
