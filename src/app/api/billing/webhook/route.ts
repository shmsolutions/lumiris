import { NextResponse } from 'next/server';
import { notifyPlanActivated, notifyPlanCanceled } from '@/libs/Email';
import { logger } from '@/libs/Logger';
import { markPaymentCanceled, markPaymentPaid } from '@/libs/Payments';
import { upsertUserProfile } from '@/libs/UserProfile';
import { parseWebhookEvent, verifyWebhookSignature } from '@/libs/Woovi';

/** Soma um mês à data atual — fim do ciclo de cobrança. */
const oneMonthFromNow = () => {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  return date;
};

const parseBody = (rawBody: string): unknown => {
  try {
    return JSON.parse(rawBody || '{}');
  } catch {
    return {};
  }
};

export const POST = async (request: Request) => {
  const rawBody = await request.text();
  const signature = request.headers.get('x-webhook-signature');

  if (!verifyWebhookSignature(rawBody, signature)) {
    logger.warn('Woovi webhook com assinatura inválida — ignorado');
    return NextResponse.json({ error: 'invalid_signature' }, { status: 401 });
  }

  const event = parseWebhookEvent(parseBody(rawBody));

  // Evento sem correlationID nosso (ex: teste do Woovi). Confirma recebimento.
  if (!event.userId) {
    return NextResponse.json({ ok: true });
  }

  try {
    if (event.kind === 'paid' && event.plan && event.plan !== 'free') {
      await upsertUserProfile(event.userId, {
        plan: event.plan,
        subscriptionStatus: 'active',
        currentPeriodEnd: oneMonthFromNow(),
      });
      if (event.correlationId) {
        await markPaymentPaid(event.correlationId);
      }
      logger.info(`Plano ${event.plan} liberado para ${event.userId} via Woovi`);
      await notifyPlanActivated(event.userId, event.plan);
    } else if (event.kind === 'canceled') {
      await upsertUserProfile(event.userId, {
        plan: 'free',
        subscriptionStatus: 'canceled',
      });
      if (event.correlationId) {
        await markPaymentCanceled(event.correlationId);
      }
      logger.info(`Assinatura cancelada/expirada para ${event.userId} — voltou pro free`);
      await notifyPlanCanceled(event.userId);
    }
  } catch (error) {
    // Não estoura 500: loga e devolve 200 pra evitar retentativas em loop do Woovi.
    logger.error(`Erro ao processar webhook Woovi ${event.userId}: ${(error as Error).message}`);
  }

  return NextResponse.json({ ok: true });
};
