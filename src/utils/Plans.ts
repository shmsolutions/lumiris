export type PlanId = 'free' | 'student' | 'pro';

export const PLAN_IDS = ['free', 'student', 'pro'] as const;

export type PlanLimits = {
  /** Max active patients. Number.POSITIVE_INFINITY = unlimited. */
  maxPatients: number;
  /** Audio transcription + report generation. */
  ai: boolean;
  /** Which documents can be exported as PDF. */
  pdf: { anamnesis: boolean; note: boolean; report: boolean };
};

/** Preço mensal em centavos (BRL). Free não é cobrável. */
export const PLAN_PRICE_CENTS: Record<PlanId, number> = {
  free: 0,
  student: 1900,
  pro: 8900,
};

/** Planos pagos (geram assinatura no Asaas). */
export const PAID_PLAN_IDS = ['student', 'pro'] as const;

export type PaidPlanId = (typeof PAID_PLAN_IDS)[number];

export const isPaidPlan = (plan: PlanId): plan is PaidPlanId =>
  plan === 'student' || plan === 'pro';

/** Mapeia o valor cobrado (centavos) de volta pro plano — usado no webhook. */
export const getPlanByValueCents = (cents: number): PlanId | null => {
  const match = (Object.keys(PLAN_PRICE_CENTS) as PlanId[]).find(
    (plan) => PLAN_PRICE_CENTS[plan] === cents,
  );
  return match ?? null;
};

export const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
  free: {
    maxPatients: 3,
    ai: false,
    pdf: { anamnesis: true, note: false, report: false },
  },
  student: {
    maxPatients: 10,
    ai: true,
    pdf: { anamnesis: true, note: true, report: true },
  },
  pro: {
    maxPatients: Number.POSITIVE_INFINITY,
    ai: true,
    pdf: { anamnesis: true, note: true, report: true },
  },
};

/** Read the plan id from Clerk publicMetadata, defaulting to 'free'. */
export const getPlanId = (metadata: unknown): PlanId => {
  const plan = (metadata as { plan?: unknown } | null)?.plan;
  return plan === 'student' || plan === 'pro' ? plan : 'free';
};

export const getPlanLimits = (metadata: unknown): PlanLimits => PLAN_LIMITS[getPlanId(metadata)];

export const isOnboarded = (metadata: unknown): boolean =>
  (metadata as { onboarded?: unknown } | null)?.onboarded === true;
