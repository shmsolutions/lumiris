import * as z from 'zod';

export const OnboardingValidation = z.object({
  therapistName: z.string().trim().min(1).max(200),
  plan: z.enum(['free', 'student', 'pro']),
});

export type OnboardingInput = z.infer<typeof OnboardingValidation>;
