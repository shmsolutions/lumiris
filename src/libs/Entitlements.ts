import { getUserProfile } from '@/libs/UserProfile';
import type { UserProfile } from '@/libs/UserProfile';
import { PLAN_LIMITS } from '@/utils/Plans';
import type { PlanId, PlanLimits } from '@/utils/Plans';

export type Entitlements = {
  plan: PlanId;
  limits: PlanLimits;
};

/** Resolve the current plan + limits for a user from our DB. */
export const getEntitlements = async (userId: string): Promise<Entitlements> => {
  const profile = await getUserProfile(userId);
  return { plan: profile.plan, limits: PLAN_LIMITS[profile.plan] };
};

/** Janela mensal da cota de IA, ex. "2026-06" (UTC). */
export const currentAiPeriod = (): string => {
  const now = new Date();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `${now.getUTCFullYear()}-${month}`;
};

/** Gerações já consumidas no mês corrente (0 se o contador é de um mês passado). */
const aiUsedThisPeriod = (profile: UserProfile): number =>
  profile.aiPeriod === currentAiPeriod() ? profile.aiUsed : 0;

export type AiAccess = {
  /** AI can be used right now (unlimited plan or monthly credits left). */
  allowed: boolean;
  /** Plan includes unlimited AI (pro). */
  unlimited: boolean;
  /** Generations still available this month (0 when unlimited or exhausted). */
  remaining: number;
};

/** Resolve whether the user can run an AI generation, counting the monthly quota. */
export const getAiAccess = (profile: UserProfile): AiAccess => {
  const limit = PLAN_LIMITS[profile.plan].aiPerMonth;
  const unlimited = !Number.isFinite(limit);
  const remaining = unlimited ? 0 : Math.max(0, limit - aiUsedThisPeriod(profile));
  return { allowed: unlimited || remaining > 0, unlimited, remaining };
};
