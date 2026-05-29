import { clerkClient } from '@clerk/nextjs/server';
import { Resend } from 'resend';
import { Env } from '@/libs/Env';
import { logger } from '@/libs/Logger';
import { PLAN_PRICE_CENTS } from '@/utils/Plans';
import type { PaidPlanId } from '@/utils/Plans';

const resend = Env.RESEND_API_KEY ? new Resend(Env.RESEND_API_KEY) : null;
const fromAddress = Env.RESEND_FROM_EMAIL ? `Lumiris <${Env.RESEND_FROM_EMAIL}>` : null;
const appUrl = Env.NEXT_PUBLIC_APP_URL || 'https://lumiris.com.br';

type EmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

/**
 * Envia um email via Resend. Sem chave configurada, vira no-op com log —
 * permite rodar dev/staging sem provider de email.
 */
export const sendEmail = async (input: EmailInput): Promise<void> => {
  if (!resend || !fromAddress) {
    logger.info('Email skipped (Resend not configured)', {
      to: input.to,
      subject: input.subject,
    });
    return;
  }

  const result = await resend.emails.send({
    from: fromAddress,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });

  if (result.error) {
    logger.error('Resend send failed', {
      to: input.to,
      subject: input.subject,
      error: result.error,
    });
  }
};

const greeting = (name: string) => (name.trim() ? `Oi ${name.trim()},` : 'Oi,');

const baseStyle =
  'font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#21211d;line-height:1.6';
const buttonStyle =
  'display:inline-block;background:#E8923C;color:#ffffff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600';
const footerStyle =
  'font-size:12px;color:#9A988C;margin-top:32px;border-top:1px solid #E6E5DE;padding-top:16px';

/** Email enviado quando o pagamento de um plano é confirmado. */
export const paymentPaidEmail = (input: {
  name: string;
  planLabel: string;
  valueCents: number;
  paidAt: Date;
}): Omit<EmailInput, 'to'> => {
  const value = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    input.valueCents / 100,
  );
  const date = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(input.paidAt);
  const subject = `Pagamento confirmado — Lumiris ${input.planLabel}`;
  const intro = greeting(input.name);

  const html = `<!doctype html><html><body style="${baseStyle}">
<h1 style="font-size:20px;margin:0 0 16px">Pagamento confirmado ✨</h1>
<p>${intro}</p>
<p>Recebemos seu pagamento do plano <strong>${input.planLabel}</strong> (${value}) em ${date}. Seu acesso já está liberado.</p>
<p style="margin:24px 0"><a href="${appUrl}/dashboard/" style="${buttonStyle}">Abrir o painel</a></p>
<p style="${footerStyle}">Lumiris — prontuário inteligente para Terapeutas Ocupacionais.</p>
</body></html>`;

  const text = `${intro}

Recebemos seu pagamento do plano ${input.planLabel} (${value}) em ${date}. Seu acesso já está liberado.

Abra o painel: ${appUrl}/dashboard/

Lumiris`;

  return { subject, html, text };
};

/** Primeiro contato logo após o cadastro/onboarding. */
export const welcomeEmail = (input: { name: string }): Omit<EmailInput, 'to'> => {
  const subject = 'Boas-vindas ao Lumiris';
  const intro = greeting(input.name);

  const html = `<!doctype html><html><body style="${baseStyle}">
<h1 style="font-size:20px;margin:0 0 16px">Que bom ter você aqui ✨</h1>
<p>${intro}</p>
<p>O Lumiris transforma horas de prontuário em minutos. Comece cadastrando um paciente e gravando a primeira evolução — a IA organiza pra você revisar.</p>
<p style="margin:24px 0"><a href="${appUrl}/dashboard/" style="${buttonStyle}">Abrir o painel</a></p>
<p>Qualquer dúvida, é só responder este e-mail.</p>
<p style="${footerStyle}">Lumiris — prontuário inteligente para Terapeutas Ocupacionais.</p>
</body></html>`;

  const text = `${intro}

O Lumiris transforma horas de prontuário em minutos. Comece cadastrando um paciente e gravando a primeira evolução — a IA organiza pra você revisar.

Abra o painel: ${appUrl}/dashboard/

Qualquer dúvida, é só responder este e-mail.

Lumiris`;

  return { subject, html, text };
};

/** Digest de relatórios trimestrais vencendo, enviado pela cron. */
export const reportReminderEmail = (input: {
  name: string;
  patients: { fullName: string; dueLabel: string }[];
}): Omit<EmailInput, 'to'> => {
  const count = input.patients.length;
  const subject =
    count === 1
      ? '1 relatório trimestral chegando o prazo — Lumiris'
      : `${count} relatórios trimestrais chegando o prazo — Lumiris`;
  const intro = greeting(input.name);

  const items = input.patients
    .map(
      (p) =>
        `<li style="margin-bottom:6px"><strong>${p.fullName}</strong> — <span style="color:#9A988C">${p.dueLabel}</span></li>`,
    )
    .join('');
  const textItems = input.patients.map((p) => `- ${p.fullName} (${p.dueLabel})`).join('\n');

  const html = `<!doctype html><html><body style="${baseStyle}">
<h1 style="font-size:20px;margin:0 0 16px">Relatórios trimestrais a caminho</h1>
<p>${intro}</p>
<p>Estes pacientes estão com o relatório trimestral chegando no prazo:</p>
<ul style="padding-left:18px;margin:16px 0">${items}</ul>
<p style="margin:24px 0"><a href="${appUrl}/dashboard/reports/" style="${buttonStyle}">Gerar relatórios</a></p>
<p style="${footerStyle}">Lumiris — a gente avisa pra você não correr na última hora.</p>
</body></html>`;

  const text = `${intro}

Estes pacientes estão com o relatório trimestral chegando no prazo:

${textItems}

Gerar relatórios: ${appUrl}/dashboard/reports/

Lumiris`;

  return { subject, html, text };
};

const planLabels: Record<PaidPlanId, string> = {
  student: 'Estudante',
  pro: 'Profissional',
};

const fetchUserContact = async (userId: string) => {
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const email =
    user.primaryEmailAddress?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? null;
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return { email, name };
};

/** Notifica o usuário que o plano pago foi liberado. Best-effort — não joga. */
export const notifyPlanActivated = async (userId: string, plan: PaidPlanId): Promise<void> => {
  try {
    const { email, name } = await fetchUserContact(userId);
    if (!email) {
      logger.warn('No email for user, skipping payment confirmation', { userId });
      return;
    }
    const template = paymentPaidEmail({
      name,
      planLabel: planLabels[plan],
      valueCents: PLAN_PRICE_CENTS[plan],
      paidAt: new Date(),
    });
    await sendEmail({ to: email, ...template });
  } catch (error) {
    logger.error('notifyPlanActivated failed', { userId, error: (error as Error).message });
  }
};

/** Envia o e-mail de boas-vindas. Best-effort — não joga. */
export const notifyWelcome = async (userId: string): Promise<void> => {
  try {
    const { email, name } = await fetchUserContact(userId);
    if (!email) {
      logger.warn('No email for user, skipping welcome', { userId });
      return;
    }
    await sendEmail({ to: email, ...welcomeEmail({ name }) });
  } catch (error) {
    logger.error('notifyWelcome failed', { userId, error: (error as Error).message });
  }
};

/**
 * Envia o digest de relatórios vencendo. Devolve true se o e-mail saiu (pra
 * cron só marcar os pacientes como avisados quando o envio acontece).
 */
export const notifyReportReminder = async (
  userId: string,
  patients: { fullName: string; dueLabel: string }[],
): Promise<boolean> => {
  if (patients.length === 0) {
    return false;
  }
  try {
    const { email, name } = await fetchUserContact(userId);
    if (!email) {
      logger.warn('No email for user, skipping report reminder', { userId });
      return false;
    }
    await sendEmail({ to: email, ...reportReminderEmail({ name, patients }) });
    return true;
  } catch (error) {
    logger.error('notifyReportReminder failed', { userId, error: (error as Error).message });
    return false;
  }
};

/** Notifica o usuário que o plano foi cancelado. Best-effort — não joga. */
export const notifyPlanCanceled = async (userId: string): Promise<void> => {
  try {
    const { email, name } = await fetchUserContact(userId);
    if (!email) {
      logger.warn('No email for user, skipping cancellation notice', { userId });
      return;
    }
    const template = planCanceledEmail({ name });
    await sendEmail({ to: email, ...template });
  } catch (error) {
    logger.error('notifyPlanCanceled failed', { userId, error: (error as Error).message });
  }
};

/** Email enviado quando o plano pago é cancelado (manual ou via webhook). */
export const planCanceledEmail = (input: { name: string }): Omit<EmailInput, 'to'> => {
  const subject = 'Plano cancelado — Lumiris';
  const intro = greeting(input.name);

  const html = `<!doctype html><html><body style="${baseStyle}">
<h1 style="font-size:20px;margin:0 0 16px">Seu plano foi cancelado</h1>
<p>${intro}</p>
<p>Sua assinatura paga foi encerrada e sua conta voltou para o plano gratuito. Seus dados continuam preservados.</p>
<p>Quando quiser voltar, é só escolher um plano no painel.</p>
<p style="margin:24px 0"><a href="${appUrl}/dashboard/settings/billing/" style="${buttonStyle}">Ver planos</a></p>
<p style="${footerStyle}">Lumiris — obrigado por ter testado com a gente.</p>
</body></html>`;

  const text = `${intro}

Sua assinatura paga foi encerrada e sua conta voltou para o plano gratuito. Seus dados continuam preservados.

Ver planos: ${appUrl}/dashboard/settings/billing/

Lumiris`;

  return { subject, html, text };
};
