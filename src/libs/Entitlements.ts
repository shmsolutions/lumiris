import { getUserProfile } from '@/libs/UserProfile';
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
