import * as z from 'zod';

const empty = z
  .string()
  .trim()
  .transform((v) => (v.length === 0 ? undefined : v))
  .optional();

export const PatientCreateValidation = z.object({
  fullName: z.string().trim().min(2).max(200),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .or(z.literal('').transform(() => undefined)),
  guardianName: empty,
  guardianRelation: empty,
  contactPhone: empty,
  contactEmail: z
    .email()
    .optional()
    .or(z.literal('').transform(() => undefined)),
  naturality: empty,
  maritalStatus: empty,
  gender: empty,
  profession: empty,
  residentialAddress: empty,
  commercialAddress: empty,
  diagnosis: empty,
  cid: empty,
  mainComplaint: empty,
  school: empty,
  otherProfessionals: empty,
  notes: empty,
});

export const PatientUpdateValidation = PatientCreateValidation.partial();

export type PatientCreateInput = z.infer<typeof PatientCreateValidation>;
export type PatientUpdateInput = z.infer<typeof PatientUpdateValidation>;
