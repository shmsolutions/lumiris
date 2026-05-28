import * as z from 'zod';

export const TherapistProfileValidation = z.object({
  therapistName: z
    .string()
    .trim()
    .max(200)
    .optional()
    .or(z.literal('').transform(() => undefined)),
  crefito: z
    .string()
    .trim()
    .max(40)
    .optional()
    .or(z.literal('').transform(() => undefined)),
  studentName: z
    .string()
    .trim()
    .max(120)
    .optional()
    .or(z.literal('').transform(() => undefined)),
});

export type TherapistProfileInput = z.infer<typeof TherapistProfileValidation>;
