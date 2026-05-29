import { getUserProfile } from '@/libs/UserProfile';
import type { UserProfile } from '@/libs/UserProfile';
import { FREE_AI_TRIAL, PLAN_LIMITS } from '@/utils/Plans';
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

export type AiAccess = {
  /** AI can be used right now (paid plan or free trial credits left). */
  allowed: boolean;
  /** Plan includes unlimited AI (paid). */
  unlimited: boolean;
  /** Free-trial generations still available (0 when paid or exhausted). */
  trialRemaining: number;
};

/** Resolve whether the user can run an AI generation, counting the free trial. */
export const getAiAccess = (profile: UserProfile): AiAccess => {
  const unlimited = PLAN_LIMITS[profile.plan].ai;
  const trialRemaining = unlimited ? 0 : Math.max(0, FREE_AI_TRIAL - profile.aiTrialUsed);
  return { allowed: unlimited || trialRemaining > 0, unlimited, trialRemaining };
};
