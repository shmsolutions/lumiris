import * as z from 'zod';

export const AppointmentStatus = z.enum(['scheduled', 'completed', 'cancelled']);

export const AppointmentCreateValidation = z.object({
  patientId: z.uuid(),
  /** ISO 8601 datetime in local timezone, e.g. "2026-05-26T14:00". */
  startsAt: z.iso.datetime({ local: true }),
  durationMinutes: z.number().int().min(5).max(480),
  status: AppointmentStatus.optional().default('scheduled'),
  notes: z.string().optional().default(''),
});

export const AppointmentUpdateValidation = AppointmentCreateValidation.partial();

export type AppointmentCreateInput = z.infer<typeof AppointmentCreateValidation>;
