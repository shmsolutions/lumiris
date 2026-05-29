import { sql } from 'drizzle-orm';
import {
  boolean,
  date,
  index,
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
  therapistName: varchar('therapist_name', { length: 200 }),
  crefito: varchar('crefito', { length: 40 }),
  studentName: varchar('student_name', { length: 120 }),
  plan: varchar('plan', { length: 16 }).default('free').notNull(),
  onboarded: boolean('onboarded').default(false).notNull(),
  // CPF/CNPJ do cliente — exigido pelo Asaas pra criar a assinatura.
  taxId: varchar('tax_id', { length: 20 }),
  // Billing (Asaas) — cliente e assinatura recorrente.
  asaasCustomerId: varchar('asaas_customer_id', { length: 64 }),
  asaasSubscriptionId: varchar('asaas_subscription_id', { length: 64 }),
  // Legado Woovi — mantido pra não exigir migração destrutiva; não é mais usado.
  wooviSubscriptionId: varchar('woovi_subscription_id', { length: 120 }),
  // Assinatura (imagem) embutida nos exports — base64 + mime. Recurso pago.
  signatureData: text('signature_data'),
  signatureMime: varchar('signature_mime', { length: 40 }),
  // Modelo padrão por tipo de documento: { relatorio, evolucao, avaliacao } → templateId.
  defaultTemplates: jsonb('default_templates'),
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
    // Modelo custom (Fase 4). null = formato padrão lendo `data`.
    templateId: uuid('template_id').references(() => templateSchema.id, { onDelete: 'set null' }),
    values: jsonb('values'),
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
  // Modelo custom (Fase 4). null = formato padrão lendo `content`.
  templateId: uuid('template_id').references(() => templateSchema.id, { onDelete: 'set null' }),
  values: jsonb('values'),
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
  // Modelo custom (Fase 4). null = formato padrão lendo as colunas acima.
  templateId: uuid('template_id').references(() => templateSchema.id, { onDelete: 'set null' }),
  values: jsonb('values'),
  linkedObjectives: jsonb('linked_objectives').default(sql`'[]'::jsonb`),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

/**
 * Histórico de cobranças do Asaas. Uma row por cobrança gerada (inclusive
 * renovações da assinatura); o status muda via webhook (pago/cancelado).
 * Alimenta a lista de pagamentos no billing.
 */
export const paymentSchema = pgTable('payment', {
  id: uuid('id').defaultRandom().primaryKey(),
  ownerId: varchar('owner_id', { length: 64 }).notNull(),
  /** id da cobrança no Asaas (pay_xxx) — chave única pra mapear o webhook. */
  correlationId: varchar('correlation_id', { length: 120 }).notNull().unique(),
  /** id da assinatura no Asaas (sub_xxx) que gerou esta cobrança. */
  asaasSubscriptionId: varchar('asaas_subscription_id', { length: 64 }),
  /** Legado Woovi — mantido pra evitar migração destrutiva; não é mais usado. */
  wooviChargeId: varchar('woovi_charge_id', { length: 120 }),
  plan: varchar('plan', { length: 16 }).notNull(),
  valueCents: integer('value_cents').notNull(),
  /** pending | paid | canceled | expired */
  status: varchar('status', { length: 32 }).default('pending').notNull(),
  paymentLinkUrl: text('payment_link_url'),
  paidAt: timestamp('paid_at', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

/**
 * Modelo de documento personalizado do terapeuta (form builder). `docType`
 * separa relatório/evolução/avaliação; `definition` (JSONB) guarda as seções e
 * campos. Owner-scoped. Os modelos padrão CREFITO ficam em código, não aqui.
 */
export const templateSchema = pgTable(
  'template',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    ownerId: varchar('owner_id', { length: 64 }).notNull(),
    docType: varchar('doc_type', { length: 16 }).notNull(),
    name: varchar('name', { length: 120 }).notNull(),
    description: text('description'),
    definition: jsonb('definition')
      .notNull()
      .default(sql`'{"version":1,"sections":[]}'::jsonb`),
    archivedAt: timestamp('archived_at', { mode: 'date' }),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => [index('template_owner_doctype_idx').on(table.ownerId, table.docType)],
);
