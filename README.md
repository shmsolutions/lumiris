# Lume

> O prontuário que evolui com você.

Lume é um prontuário inteligente para **terapeutas ocupacionais**. Ele torna três fluxos 10x mais rápidos que planilhas e Word:

1. **Cadastro + anamnese estruturada** no padrão CREFITO.
2. **Evolução por áudio com IA** — fale a sessão, o Lume transcreve e estrutura em SOAP.
3. **Relatório trimestral automático** a partir das evoluções acumuladas.

Tudo em português, pensado para uso **mobile-first**, com export de PDF no formato oficial CREFITO (avaliação, evolução e relatório).

## Stack

- **Next.js 16** (App Router) + **TypeScript**
- **Tailwind CSS v4**
- **Clerk** (autenticação)
- **Drizzle ORM** — PGLite no dev, **Neon (Postgres)** em produção
- **next-intl** (pt-BR padrão, en como secundário)
- **OpenAI** (transcrição Whisper + estruturação/relatório com gpt-4.1-mini)
- **@react-pdf/renderer** (PDFs CREFITO)
- **Woovi** (assinatura recorrente via Pix)

## Rodando localmente

```bash
npm install
npm run dev
```

O banco local usa PGLite (`local.db`) — não precisa de Docker. As migrations rodam automaticamente ao subir o dev server.

Crie um `.env.local` com as chaves (não comitado):

```bash
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
OPENAI_API_KEY=sk-...        # opcional; sem ela a IA roda em modo mock
WOOVI_APP_ID=...             # opcional; sem ela o billing roda em modo mock
```

## Scripts

| Script | O que faz |
| --- | --- |
| `npm run dev` | Sobe o app + banco local |
| `npm run build` | Migrations + build de produção |
| `npm run check:types` | TypeScript |
| `npm run lint` | Lint (oxlint/ultracite) |
| `npm run check:i18n` | Paridade das traduções |
| `npm run test` | Testes unitários (Vitest) |
| `npm run test:e2e` | Testes E2E (Playwright) |

## Deploy

Vercel + Neon. Configure as variáveis de ambiente (incluindo `DATABASE_URL` do Neon com `?sslmode=require`) antes do primeiro build — o build roda as migrations automaticamente.

## Licença

MIT © Rian
