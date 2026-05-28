import * as z from 'zod';

/** Aceita CPF (11) ou CNPJ (14) dígitos; ignora pontuação. */
const taxId = z
  .string()
  .transform((value) => value.replaceAll(/\D/g, ''))
  .refine((digits) => digits.length === 11 || digits.length === 14, {
    message: 'invalid_tax_id',
  });

export const CheckoutValidation = z.object({
  plan: z.enum(['student', 'pro']),
  taxId,
});

export type CheckoutInput = z.infer<typeof CheckoutValidation>;
