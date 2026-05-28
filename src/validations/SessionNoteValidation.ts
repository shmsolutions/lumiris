import * as z from 'zod';

export const EvolutionValidation = z.object({
  procedimento: z.string().default(''),
  intercorrencia: z.string().default(''),
  evolucao: z.string().default(''),
});

export const SessionNoteCreateValidation = z.object({
  sessionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  appointmentId: z.uuid().optional().nullable(),
  transcript: z.string().optional().default(''),
  rawText: z.string().optional().default(''),
  procedimento: z.string().default(''),
  intercorrencia: z.string().default(''),
  evolucao: z.string().default(''),
  linkedObjectives: z.array(z.uuid()).default([]),
});

export const SessionNoteUpdateValidation = SessionNoteCreateValidation.partial();

export const DraftFromTextValidation = z.object({
  text: z.string().optional().default(''),
});

export type SessionNoteCreateInput = z.infer<typeof SessionNoteCreateValidation>;
