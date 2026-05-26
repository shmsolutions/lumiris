import * as z from 'zod';

export const CheckoutValidation = z.object({
  plan: z.enum(['student', 'pro']),
});

export type CheckoutInput = z.infer<typeof CheckoutValidation>;
