import { desc, eq } from 'drizzle-orm';
import { db } from '@/libs/DB';
import { paymentSchema } from '@/models/Schema';
import type { PaidPlanId } from '@/utils/Plans';

export type PaymentRecord = typeof paymentSchema.$inferSelect;

/**
 * Persiste uma cobrança criada no Woovi. Idempotente por correlationId:
 * se já existir (ex: clique duplo durante a reconciliação), apenas atualiza
 * os campos voláteis sem duplicar a linha.
 */
export const recordPayment = async (input: {
  ownerId: string;
  correlationId: string;
  wooviChargeId: string;
  plan: PaidPlanId;
  valueCents: number;
  paymentLinkUrl: string;
}) => {
  await db
    .insert(paymentSchema)
    .values({
      ownerId: input.ownerId,
      correlationId: input.correlationId,
      wooviChargeId: input.wooviChargeId,
      plan: input.plan,
      valueCents: input.valueCents,
      paymentLinkUrl: input.paymentLinkUrl,
      status: 'pending',
    })
    .onConflictDoUpdate({
      target: paymentSchema.correlationId,
      set: {
        wooviChargeId: input.wooviChargeId,
        paymentLinkUrl: input.paymentLinkUrl,
      },
    });
};

export const markPaymentPaid = async (correlationId: string) => {
  await db
    .update(paymentSchema)
    .set({ status: 'paid', paidAt: new Date() })
    .where(eq(paymentSchema.correlationId, correlationId));
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
