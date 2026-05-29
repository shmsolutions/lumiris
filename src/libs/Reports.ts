import { and, eq, isNull, max } from 'drizzle-orm';
import { db } from '@/libs/DB';
import { patientSchema, reportSchema } from '@/models/Schema';

/** Cadência do relatório trimestral (dias entre relatórios). */
export const REPORT_CADENCE_DAYS = 90;
/** A partir de quantos dias antes do vencimento o relatório vira "pendente". */
export const REPORT_REMINDER_WINDOW_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

export type PendingReport = {
  patientId: string;
  fullName: string;
  /** Quando o próximo relatório vence (último período + cadência). */
  nextDue: Date;
  /** Dias até o vencimento (negativo se já venceu). */
  daysUntil: number;
  overdue: boolean;
};

/** Próximo vencimento = âncora + cadência. Âncora = último período ou criação. */
const nextDueFrom = (lastPeriodEnd: string | null, createdAt: Date) => {
  const anchor = lastPeriodEnd ? new Date(`${lastPeriodEnd}T12:00:00`) : createdAt;
  return new Date(anchor.getTime() + REPORT_CADENCE_DAYS * DAY_MS);
};

const toPending = (
  row: { patientId: string; fullName: string; createdAt: Date; lastPeriodEnd: string | null },
  now: number,
): PendingReport => {
  const nextDue = nextDueFrom(row.lastPeriodEnd, row.createdAt);
  const daysUntil = Math.ceil((nextDue.getTime() - now) / DAY_MS);
  return {
    patientId: row.patientId,
    fullName: row.fullName,
    nextDue,
    daysUntil,
    overdue: nextDue.getTime() < now,
  };
};

const isWithinWindow = (pending: PendingReport) => pending.daysUntil <= REPORT_REMINDER_WINDOW_DAYS;

/** Pacientes ativos do dono com relatório vencendo (≤ 30d) ou vencido. */
export const getPendingReports = async (userId: string): Promise<PendingReport[]> => {
  const now = Date.now();
  const rows = await db
    .select({
      patientId: patientSchema.id,
      fullName: patientSchema.fullName,
      createdAt: patientSchema.createdAt,
      lastPeriodEnd: max(reportSchema.periodEnd),
    })
    .from(patientSchema)
    .leftJoin(reportSchema, eq(reportSchema.patientId, patientSchema.id))
    .where(and(eq(patientSchema.ownerId, userId), isNull(patientSchema.archivedAt)))
    .groupBy(patientSchema.id, patientSchema.fullName, patientSchema.createdAt);

  return rows
    .map((row) => toPending(row, now))
    .filter(isWithinWindow)
    .toSorted((a, b) => a.nextDue.getTime() - b.nextDue.getTime());
};

export type OwnerPending = { ownerId: string; patients: PendingReport[] };

/**
 * Versão pra cron: todos os donos, só pacientes ainda não avisados neste ciclo
 * (`reportReminderSentAt` null), agrupados por dono.
 */
export const getUnnotifiedPendingByOwner = async (): Promise<OwnerPending[]> => {
  const now = Date.now();
  const rows = await db
    .select({
      ownerId: patientSchema.ownerId,
      patientId: patientSchema.id,
      fullName: patientSchema.fullName,
      createdAt: patientSchema.createdAt,
      lastPeriodEnd: max(reportSchema.periodEnd),
    })
    .from(patientSchema)
    .leftJoin(reportSchema, eq(reportSchema.patientId, patientSchema.id))
    .where(and(isNull(patientSchema.archivedAt), isNull(patientSchema.reportReminderSentAt)))
    .groupBy(
      patientSchema.ownerId,
      patientSchema.id,
      patientSchema.fullName,
      patientSchema.createdAt,
    );

  const byOwner = new Map<string, PendingReport[]>();
  for (const row of rows) {
    const pending = toPending(row, now);
    if (!isWithinWindow(pending)) {
      continue;
    }
    const list = byOwner.get(row.ownerId) ?? [];
    list.push(pending);
    byOwner.set(row.ownerId, list);
  }

  return [...byOwner.entries()].map(([ownerId, patients]) => ({
    ownerId,
    patients: patients.toSorted((a, b) => a.nextDue.getTime() - b.nextDue.getTime()),
  }));
};
