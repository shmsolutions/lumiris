import { eq } from 'drizzle-orm';
import { db } from '@/libs/DB';
import { userProfileSchema } from '@/models/Schema';
import { PLAN_IDS } from '@/utils/Plans';
import type { PlanId } from '@/utils/Plans';

export type UserProfile = {
  userId: string;
  therapistName: string;
  crefito: string;
  studentName: string;
  plan: PlanId;
  onboarded: boolean;
  taxId: string | null;
  asaasCustomerId: string | null;
  asaasSubscriptionId: string | null;
  subscriptionStatus: string | null;
  currentPeriodEnd: Date | null;
};

const normalizePlan = (value: string | null | undefined): PlanId =>
  PLAN_IDS.includes(value as PlanId) ? (value as PlanId) : 'free';

/**
 * Fetch the therapist profile. Returns sensible defaults if none exists yet
 * (e.g. brand-new user before onboarding).
 */
export const getUserProfile = async (userId: string): Promise<UserProfile> => {
  const [row] = await db
    .select()
    .from(userProfileSchema)
    .where(eq(userProfileSchema.userId, userId))
    .limit(1);

  return {
    userId,
    therapistName: row?.therapistName ?? '',
    crefito: row?.crefito ?? '',
    studentName: row?.studentName ?? '',
    plan: normalizePlan(row?.plan),
    onboarded: row?.onboarded ?? false,
    taxId: row?.taxId ?? null,
    asaasCustomerId: row?.asaasCustomerId ?? null,
    asaasSubscriptionId: row?.asaasSubscriptionId ?? null,
    subscriptionStatus: row?.subscriptionStatus ?? null,
    currentPeriodEnd: row?.currentPeriodEnd ?? null,
  };
};

type UpsertInput = {
  therapistName?: string | null;
  crefito?: string | null;
  studentName?: string | null;
  plan?: PlanId;
  onboarded?: boolean;
  taxId?: string | null;
  asaasCustomerId?: string | null;
  asaasSubscriptionId?: string | null;
  subscriptionStatus?: string | null;
  currentPeriodEnd?: Date | null;
};

/** Mapeia uma assinatura do Asaas (sub_xxx) de volta pro userId; null se não achar. */
export const getUserIdByAsaasSubscription = async (
  subscriptionId: string,
): Promise<string | null> => {
  const [row] = await db
    .select({ userId: userProfileSchema.userId })
    .from(userProfileSchema)
    .where(eq(userProfileSchema.asaasSubscriptionId, subscriptionId))
    .limit(1);
  return row?.userId ?? null;
};

export const upsertUserProfile = async (userId: string, data: UpsertInput) => {
  await db
    .insert(userProfileSchema)
    .values({ userId, ...data })
    .onConflictDoUpdate({
      target: userProfileSchema.userId,
      set: data,
    });
};
