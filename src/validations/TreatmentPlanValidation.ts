import * as z from 'zod';

export const ObjectiveStatus = z.enum(['active', 'achieved', 'paused', 'discontinued']);

export const ObjectiveValidation = z.object({
  id: z.uuid(),
  title: z.string().trim().min(1).max(200),
  description: z.string().optional().default(''),
  status: ObjectiveStatus.default('active'),
  /** Número de atendimentos prováveis (CREFITO). 0 = não estimado. */
  estimatedSessions: z.number().int().min(0).max(999).default(0),
  /** ISO date `yyyy-MM-dd`. */
  targetDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .or(z.literal('').transform(() => undefined)),
});

export const TreatmentPlanUpsertValidation = z.object({
  frequency: z.string().optional().default(''),
  procedures: z.string().optional().default(''),
  notes: z.string().optional().default(''),
  objectives: z.array(ObjectiveValidation).default([]),
});

export type Objective = z.infer<typeof ObjectiveValidation>;
export type TreatmentPlanInput = z.infer<typeof TreatmentPlanUpsertValidation>;
