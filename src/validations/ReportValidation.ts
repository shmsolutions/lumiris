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

/** Valores de um modelo custom: texto por campo ou linhas de objetivos. */
const TemplateValuesValidation = z.record(
  z.string(),
  z.union([z.string(), z.array(z.object({ title: z.string(), progress: z.string() }))]),
);

export const ReportCreateValidation = z.object({
  periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  content: ReportContentValidation,
  templateId: z.uuid().nullable().optional(),
  values: TemplateValuesValidation.optional(),
});

export const ReportUpdateValidation = z.object({
  content: ReportContentValidation,
  values: TemplateValuesValidation.optional(),
});

export const ReportGenerateValidation = z.object({
  periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  templateId: z.uuid().optional(),
});

export type ReportContent = z.infer<typeof ReportContentValidation>;
