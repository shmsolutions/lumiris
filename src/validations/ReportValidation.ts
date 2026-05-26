import * as z from 'zod';

export const ReportObjectiveProgressValidation = z.object({
  title: z.string().default(''),
  progress: z.string().default(''),
});

export const ReportContentValidation = z.object({
  initialComplaint: z.string().default(''),
  generalEvolution: z.string().default(''),
  objectiveProgress: z.array(ReportObjectiveProgressValidation).default([]),
  difficulties: z.string().default(''),
  suggestions: z.string().default(''),
  conclusion: z.string().default(''),
});

export const ReportCreateValidation = z.object({
  periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  content: ReportContentValidation,
});

export const ReportUpdateValidation = z.object({
  content: ReportContentValidation,
});

export const ReportGenerateValidation = z.object({
  periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export type ReportContent = z.infer<typeof ReportContentValidation>;
