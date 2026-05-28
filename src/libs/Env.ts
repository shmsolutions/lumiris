import { createEnv } from '@t3-oss/env-nextjs';
import * as z from 'zod';

export const Env = createEnv({
  server: {
    ARCJET_KEY: z.string().startsWith('ajkey_').optional(),
    CLERK_SECRET_KEY: z.string().min(1),
    DATABASE_URL: z.string().min(1),
    OPENAI_API_KEY: z.string().optional(),
    LUME_AI_MOCK: z
      .enum(['true', 'false'])
      .optional()
      .default('false')
      .transform((v) => v === 'true'),
    // Asaas (pagamentos) — chave da API enviada no header `access_token`.
    ASAAS_API_KEY: z.string().optional(),
    // Base da API: sandbox por padrão (https://api-sandbox.asaas.com/v3).
    ASAAS_BASE_URL: z.string().optional(),
    // Token compartilhado configurado no webhook do Asaas (header asaas-access-token).
    ASAAS_WEBHOOK_TOKEN: z.string().optional(),
    LUME_BILLING_MOCK: z
      .enum(['true', 'false'])
      .optional()
      .default('false')
      .transform((v) => v === 'true'),
    // Resend (emails transacionais). Sem chave, o envio vira no-op com log.
    RESEND_API_KEY: z.string().startsWith('re_').optional(),
    RESEND_FROM_EMAIL: z.email().optional(),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().optional(),
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
    NEXT_PUBLIC_LOGGING_LEVEL: z
      .enum(['error', 'info', 'debug', 'warning', 'trace', 'fatal'])
      .default('info'),
    NEXT_PUBLIC_BETTER_STACK_SOURCE_TOKEN: z.string().optional(),
    NEXT_PUBLIC_BETTER_STACK_INGESTING_HOST: z.string().optional(),
    NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
    NEXT_PUBLIC_POSTHOG_HOST: z.string().optional(),
  },
  shared: {
    NODE_ENV: z.enum(['test', 'development', 'production']).optional(),
  },
  runtimeEnv: {
    ARCJET_KEY: process.env.ARCJET_KEY,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    DATABASE_URL: process.env.DATABASE_URL,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    LUME_AI_MOCK: process.env.LUME_AI_MOCK,
    ASAAS_API_KEY: process.env.ASAAS_API_KEY,
    ASAAS_BASE_URL: process.env.ASAAS_BASE_URL,
    ASAAS_WEBHOOK_TOKEN: process.env.ASAAS_WEBHOOK_TOKEN,
    LUME_BILLING_MOCK: process.env.LUME_BILLING_MOCK,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NEXT_PUBLIC_LOGGING_LEVEL: process.env.NEXT_PUBLIC_LOGGING_LEVEL,
    NEXT_PUBLIC_BETTER_STACK_SOURCE_TOKEN: process.env.NEXT_PUBLIC_BETTER_STACK_SOURCE_TOKEN,
    NEXT_PUBLIC_BETTER_STACK_INGESTING_HOST: process.env.NEXT_PUBLIC_BETTER_STACK_INGESTING_HOST,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    NODE_ENV: process.env.NODE_ENV,
  },
  // Skip during `next build` in Docker, where server secrets aren't present.
  // Runtime (`node server.js`) still validates because this flag is unset there.
  skipValidation: process.env.SKIP_ENV_VALIDATION === 'true',
});
