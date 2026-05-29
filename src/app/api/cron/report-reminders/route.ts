import { inArray } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { notifyReportReminder } from '@/libs/Email';
import { Env } from '@/libs/Env';
import { logger } from '@/libs/Logger';
import { getUnnotifiedPendingByOwner } from '@/libs/Reports';
import type { PendingReport } from '@/libs/Reports';
import { patientSchema } from '@/models/Schema';

const dueLabel = (pending: PendingReport) => {
  if (pending.overdue) {
    return 'vencido';
  }
  if (pending.daysUntil <= 0) {
    return 'vence hoje';
  }
  return `vence em ${pending.daysUntil} ${pending.daysUntil === 1 ? 'dia' : 'dias'}`;
};

/**
 * Dispara o digest de relatórios trimestrais vencendo, um por terapeuta.
 * Acionado por scheduled task (Coolify) com `Authorization: Bearer ${CRON_SECRET}`.
 */
export const GET = async (request: Request) => {
  if (!Env.CRON_SECRET) {
    return NextResponse.json({ error: 'cron_not_configured' }, { status: 503 });
  }
  if (request.headers.get('authorization') !== `Bearer ${Env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const owners = await getUnnotifiedPendingByOwner();
  let emails = 0;
  let patients = 0;

  for (const owner of owners) {
    const sent = await notifyReportReminder(
      owner.ownerId,
      owner.patients.map((p) => ({ fullName: p.fullName, dueLabel: dueLabel(p) })),
    );
    if (sent) {
      emails += 1;
      patients += owner.patients.length;
      await db
        .update(patientSchema)
        .set({ reportReminderSentAt: new Date() })
        .where(
          inArray(
            patientSchema.id,
            owner.patients.map((p) => p.patientId),
          ),
        );
    }
  }

  logger.info('Report reminders run', { owners: owners.length, emails, patients });
  return NextResponse.json({ owners: owners.length, emails, patients });
};
