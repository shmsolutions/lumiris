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
  // O CPF/CNPJ agora é coletado na própria página do checkout do Asaas.
  taxId: taxId.optional(),
});

export type CheckoutInput = z.infer<typeof CheckoutValidation>;

/** Pix gera a cobrança via API (QR no app), então o CPF/CNPJ é obrigatório. */
export const PixCheckoutValidation = z.object({
  plan: z.enum(['student', 'pro']),
  taxId,
});
