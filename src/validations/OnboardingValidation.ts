import * as z from 'zod';

export const OnboardingValidation = z.object({
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
  plan: z.enum(['free', 'student', 'pro']),
});

export type OnboardingInput = z.infer<typeof OnboardingValidation>;
