import { sql } from 'drizzle-orm';
import {
  boolean,
  date,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

/**
 * Perfil do terapeuta — fonte da verdade pra plano, onboarding e dados
 * profissionais. Keyed pelo Clerk userId. Fica no nosso banco (não no Clerk
 * metadata) pra leitura rápida e resiliente a quedas da API do Clerk.
 */
export const userProfileSchema = pgTable('user_profile', {
  userId: varchar('user_id', { length: 64 }).primaryKey(),
  crefito: varchar('crefito', { length: 40 }),
  studentName: varchar('student_name', { length: 120 }),
  plan: varchar('plan', { length: 16 }).default('free').notNull(),
  onboarded: boolean('onboarded').default(false).notNull(),
  // Billing (Woovi) — preenchido na Wave 3.
  wooviSubscriptionId: varchar('woovi_subscription_id', { length: 120 }),
  subscriptionStatus: varchar('subscription_status', { length: 32 }),
  currentPeriodEnd: timestamp('current_period_end', { mode: 'date' }),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

export const counterSchema = pgTable('counter', {
  id: serial('id').primaryKey(),
  count: integer('count').default(0),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

/**
 * Paciente — registro central. Ownership por `ownerId` (Clerk userId do terapeuta).
 */
export const patientSchema = pgTable(
  'patient',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    ownerId: varchar('owner_id', { length: 64 }).notNull(),
    fullName: varchar('full_name', { length: 200 }).notNull(),
    birthDate: date('birth_date', { mode: 'string' }),
    guardianName: varchar('guardian_name', { length: 200 }),
    guardianRelation: varchar('guardian_relation', { length: 80 }),
    contactPhone: varchar('contact_phone', { length: 40 }),
    contactEmail: varchar('contact_email', { length: 200 }),
    naturality: varchar('naturality', { length: 100 }),
    maritalStatus: varchar('marital_status', { length: 40 }),
    gender: varchar('gender', { length: 40 }),
    profession: varchar('profession', { length: 100 }),
    residentialAddress: text('residential_address'),
    commercialAddress: text('commercial_address'),
    diagnosis: text('diagnosis'),
    cid: varchar('cid', { length: 32 }),
    mainComplaint: text('main_complaint'),
    school: varchar('school', { length: 200 }),
    otherProfessionals: text('other_professionals'),
    notes: text('notes'),
    archivedAt: timestamp('archived_at', { mode: 'date' }),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex('patient_owner_name_idx').on(table.ownerId, table.fullName)],
);

/**
 * Anamnese — uma por paciente. Conteúdo estruturado guardado como JSONB
 * pra permitir evolução do formulário sem migração a cada campo.
 */
export const anamnesisSchema = pgTable(
  'anamnesis',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patientSchema.id, { onDelete: 'cascade' }),
    ownerId: varchar('owner_id', { length: 64 }).notNull(),
    data: jsonb('data')
      .notNull()
      .default(sql`'{}'::jsonb`),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex('anamnesis_patient_idx').on(table.patientId)],
);

/**
 * Plano terapêutico — vinculado ao paciente, um por paciente (pode evoluir
 * via updates).
 */
export const treatmentPlanSchema = pgTable(
  'treatment_plan',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patientSchema.id, { onDelete: 'cascade' }),
    ownerId: varchar('owner_id', { length: 64 }).notNull(),
    objectives: jsonb('objectives')
      .notNull()
      .default(sql`'[]'::jsonb`),
    frequency: varchar('frequency', { length: 80 }),
    procedures: text('procedures'),
    notes: text('notes'),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex('treatment_plan_patient_idx').on(table.patientId)],
);

/**
 * Relatório trimestral — gerado por IA a partir de anamnese + plano + evoluções.
 * Conteúdo estruturado em JSONB; o terapeuta revisa antes de finalizar.
 */
export const reportSchema = pgTable('report', {
  id: uuid('id').defaultRandom().primaryKey(),
  patientId: uuid('patient_id')
    .notNull()
    .references(() => patientSchema.id, { onDelete: 'cascade' }),
  ownerId: varchar('owner_id', { length: 64 }).notNull(),
  periodStart: date('period_start', { mode: 'string' }).notNull(),
  periodEnd: date('period_end', { mode: 'string' }).notNull(),
  content: jsonb('content')
    .notNull()
    .default(sql`'{}'::jsonb`),
  status: varchar('status', { length: 24 }).default('draft').notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

/**
 * Anexo — laudo médico, parecer da escola, etc. Conteúdo em base64 (MVP).
 * Para produção, migrar para blob storage (Vercel Blob / Supabase).
 */
export const attachmentSchema = pgTable('attachment', {
  id: uuid('id').defaultRandom().primaryKey(),
  patientId: uuid('patient_id')
    .notNull()
    .references(() => patientSchema.id, { onDelete: 'cascade' }),
  ownerId: varchar('owner_id', { length: 64 }).notNull(),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  mimeType: varchar('mime_type', { length: 120 }).notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  category: varchar('category', { length: 40 }).default('outro').notNull(),
  data: text('data').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

/**
 * Agendamento — calendário básico.
 */
export const appointmentSchema = pgTable('appointment', {
  id: uuid('id').defaultRandom().primaryKey(),
  patientId: uuid('patient_id')
    .notNull()
    .references(() => patientSchema.id, { onDelete: 'cascade' }),
  ownerId: varchar('owner_id', { length: 64 }).notNull(),
  startsAt: timestamp('starts_at', { mode: 'date' }).notNull(),
  durationMinutes: integer('duration_minutes').default(50).notNull(),
  status: varchar('status', { length: 24 }).default('scheduled').notNull(),
  notes: text('notes'),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

/**
 * Evolução por sessão — gerada a partir de áudio/texto e estruturada em SOAP.
 * Pode estar vinculada a um agendamento (opcional).
 */
export const sessionNoteSchema = pgTable('session_note', {
  id: uuid('id').defaultRandom().primaryKey(),
  patientId: uuid('patient_id')
    .notNull()
    .references(() => patientSchema.id, { onDelete: 'cascade' }),
  appointmentId: uuid('appointment_id').references(() => appointmentSchema.id, {
    onDelete: 'set null',
  }),
  ownerId: varchar('owner_id', { length: 64 }).notNull(),
  sessionDate: date('session_date', { mode: 'string' }).notNull(),
  rawText: text('raw_text'),
  transcript: text('transcript'),
  procedimento: text('procedimento'),
  intercorrencia: text('intercorrencia'),
  evolucao: text('evolucao'),
  linkedObjectives: jsonb('linked_objectives').default(sql`'[]'::jsonb`),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

/**
 * Histórico de cobranças do Woovi. Uma row por charge criado; o status muda
 * via webhook (pago/cancelado). Alimenta a lista de pagamentos no billing.
 */
export const paymentSchema = pgTable('payment', {
  id: uuid('id').defaultRandom().primaryKey(),
  ownerId: varchar('owner_id', { length: 64 }).notNull(),
  /** Nosso correlationID único enviado ao Woovi — chave pra mapear o webhook. */
  correlationId: varchar('correlation_id', { length: 120 }).notNull().unique(),
  /** globalID/id da cobrança no Woovi, pra rastreio. */
  wooviChargeId: varchar('woovi_charge_id', { length: 120 }),
  plan: varchar('plan', { length: 16 }).notNull(),
  valueCents: integer('value_cents').notNull(),
  /** pending | paid | canceled | expired */
  status: varchar('status', { length: 32 }).default('pending').notNull(),
  paymentLinkUrl: text('payment_link_url'),
  paidAt: timestamp('paid_at', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});
