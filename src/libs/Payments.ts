import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/libs/DB';
import { paymentSchema } from '@/models/Schema';
import type { PaidPlanId } from '@/utils/Plans';

export type PaymentRecord = typeof paymentSchema.$inferSelect;

/**
 * Persiste uma cobrança do Asaas. Idempotente pelo id da cobrança (correlationId):
 * se já existir (ex: webhook reentregue), apenas atualiza os campos voláteis sem
 * duplicar a linha. `status` é opcional — renovações chegam direto como 'paid'.
 */
export const recordPayment = async (input: {
  ownerId: string;
  correlationId: string;
  asaasSubscriptionId: string;
  plan: PaidPlanId;
  valueCents: number;
  paymentLinkUrl: string | null;
  status?: 'pending' | 'paid';
}) => {
  const status = input.status ?? 'pending';
  await db
    .insert(paymentSchema)
    .values({
      ownerId: input.ownerId,
      correlationId: input.correlationId,
      asaasSubscriptionId: input.asaasSubscriptionId,
      plan: input.plan,
      valueCents: input.valueCents,
      paymentLinkUrl: input.paymentLinkUrl,
      status,
      paidAt: status === 'paid' ? new Date() : null,
    })
    .onConflictDoUpdate({
      target: paymentSchema.correlationId,
      set: {
        asaasSubscriptionId: input.asaasSubscriptionId,
        paymentLinkUrl: input.paymentLinkUrl,
        status,
        paidAt: status === 'paid' ? new Date() : null,
      },
    });
};

/** Marca as cobranças pendentes do usuário como pagas — usado no fluxo mock. */
export const markUserPendingPaid = async (ownerId: string) => {
  await db
    .update(paymentSchema)
    .set({ status: 'paid', paidAt: new Date() })
    .where(and(eq(paymentSchema.ownerId, ownerId), eq(paymentSchema.status, 'pending')));
};

export const markPaymentCanceled = async (correlationId: string) => {
  await db
    .update(paymentSchema)
    .set({ status: 'canceled' })
    .where(eq(paymentSchema.correlationId, correlationId));
};

export const listPaymentsForUser = async (ownerId: string): Promise<PaymentRecord[]> =>
  await db
    .select()
    .from(paymentSchema)
    .where(eq(paymentSchema.ownerId, ownerId))
    .orderBy(desc(paymentSchema.createdAt))
    .limit(50);
