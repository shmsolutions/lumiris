export type PlanId = 'free' | 'student' | 'pro';

export const PLAN_IDS = ['free', 'student', 'pro'] as const;

export type PlanLimits = {
  /** Max active patients. Number.POSITIVE_INFINITY = unlimited. */
  maxPatients: number;
  /** AI generations allowed per calendar month. Number.POSITIVE_INFINITY = unlimited. */
  aiPerMonth: number;
  /** Which documents can be exported as PDF. */
  pdf: { anamnesis: boolean; note: boolean; report: boolean };
  /** Upload a signature image embedded into exported documents. */
  signature: boolean;
  /** Create and edit custom document templates (form builder). */
  customTemplates: boolean;
};

/** Preço mensal em centavos (BRL). Free não é cobrável. */
export const PLAN_PRICE_CENTS: Record<PlanId, number> = {
  free: 0,
  student: 900,
  pro: 2900,
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
    maxPatients: 5,
    aiPerMonth: 5,
    pdf: { anamnesis: true, note: false, report: false },
    signature: false,
    customTemplates: false,
  },
  student: {
    maxPatients: 10,
    aiPerMonth: 30,
    pdf: { anamnesis: true, note: true, report: true },
    signature: true,
    customTemplates: true,
  },
  pro: {
    maxPatients: Number.POSITIVE_INFINITY,
    aiPerMonth: Number.POSITIVE_INFINITY,
    pdf: { anamnesis: true, note: true, report: true },
    signature: true,
    customTemplates: true,
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
