import { NextResponse } from 'next/server';
import { logger } from '@/libs/Logger';
import { upsertUserProfile } from '@/libs/UserProfile';
import { parseWebhookEvent, verifyWebhookSignature } from '@/libs/Woovi';

/** Soma um mês à data atual — fim do ciclo de cobrança. */
const oneMonthFromNow = () => {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  return date;
};

export const POST = async (request: Request) => {
  const rawBody = await request.text();
  const signature = request.headers.get('x-webhook-signature');

  if (!verifyWebhookSignature(rawBody, signature)) {
    logger.warn('Woovi webhook com assinatura inválida — ignorado');
    return NextResponse.json({ error: 'invalid_signature' }, { status: 401 });
  }

  const payload = JSON.parse(rawBody || '{}');
  const event = parseWebhookEvent(payload);

  if (!event.userId) {
    // Evento sem correlationID nosso (ex: teste do Woovi). Confirma recebimento.
    return NextResponse.json({ ok: true });
  }

  if (event.kind === 'paid' && event.plan && event.plan !== 'free') {
    await upsertUserProfile(event.userId, {
      plan: event.plan,
      subscriptionStatus: 'active',
      currentPeriodEnd: oneMonthFromNow(),
    });
    logger.info(`Plano ${event.plan} liberado para ${event.userId} via Woovi`);
  } else if (event.kind === 'canceled') {
    await upsertUserProfile(event.userId, {
      plan: 'free',
      subscriptionStatus: 'canceled',
    });
    logger.info(`Assinatura cancelada/expirada para ${event.userId} — voltou pro free`);
  }

  return NextResponse.json({ ok: true });
};
