import * as z from 'zod';

export const EvolutionValidation = z.object({
  procedimento: z.string().default(''),
  intercorrencia: z.string().default(''),
  evolucao: z.string().default(''),
});

const TemplateValuesValidation = z.record(
  z.string(),
  z.union([z.string(), z.array(z.object({ title: z.string(), progress: z.string() }))]),
);

export const SessionNoteCreateValidation = z.object({
  sessionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  appointmentId: z.uuid().optional().nullable(),
  transcript: z.string().optional().default(''),
  rawText: z.string().optional().default(''),
  procedimento: z.string().default(''),
  intercorrencia: z.string().default(''),
  evolucao: z.string().default(''),
  linkedObjectives: z.array(z.uuid()).default([]),
  templateId: z.uuid().nullable().optional(),
  values: TemplateValuesValidation.optional(),
});

export const SessionNoteUpdateValidation = SessionNoteCreateValidation.partial();

export const DraftFromTextValidation = z.object({
  text: z.string().optional().default(''),
});

export type SessionNoteCreateInput = z.infer<typeof SessionNoteCreateValidation>;
