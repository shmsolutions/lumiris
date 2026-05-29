import * as z from 'zod';

const KEY_PATTERN = /^[a-zA-Z][a-zA-Z0-9_]*$/;

export const DOC_TYPES = ['relatorio', 'evolucao', 'avaliacao'] as const;
export const FILL_MODES = [
  'manual',
  'auto_patient_name',
  'auto_patient_birthdate',
  'auto_patient_diagnosis',
  'auto_patient_cid',
  'auto_therapist_name',
  'auto_crefito',
  'auto_student_name',
  'auto_today',
  'auto_period_start',
  'auto_period_end',
  'auto_session_date',
] as const;
export const INPUT_TYPES = ['text', 'textarea', 'date', 'number'] as const;
export const SECTION_TYPES = ['header', 'narrative', 'objectives_table'] as const;

export const DocTypeValidation = z.enum(DOC_TYPES);
const FillModeValidation = z.enum(FILL_MODES);
const InputTypeValidation = z.enum(INPUT_TYPES);
const SectionTypeValidation = z.enum(SECTION_TYPES);

export type DocType = z.infer<typeof DocTypeValidation>;

const TemplateFieldValidation = z.object({
  /** Stable slug — values are keyed by this. Never re-key on label edit. */
  key: z.string().regex(KEY_PATTERN).max(60),
  label: z.string().min(1).max(120),
  inputType: InputTypeValidation.default('textarea'),
  fillMode: FillModeValidation.default('manual'),
  /** Instruction shown during recording and fed to the AI for this field. */
  guide: z.string().max(2000).optional(),
  defaultValue: z.string().max(2000).optional(),
});

const TemplateSectionValidation = z.object({
  key: z.string().regex(KEY_PATTERN).max(60),
  type: SectionTypeValidation,
  title: z.string().min(1).max(120),
  guide: z.string().max(2000).optional(),
  fields: z.array(TemplateFieldValidation).default([]),
});

export const TemplateDefinitionValidation = z.object({
  version: z.literal(1).default(1),
  sections: z.array(TemplateSectionValidation).default([]),
});

export const TemplateCreateValidation = z.object({
  docType: DocTypeValidation,
  name: z.string().min(1).max(120),
  description: z.string().max(1000).optional(),
  definition: TemplateDefinitionValidation,
});

export const TemplateUpdateValidation = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(1000).optional(),
  definition: TemplateDefinitionValidation,
});

export type TemplateDefinition = z.infer<typeof TemplateDefinitionValidation>;
export type TemplateSection = z.infer<typeof TemplateSectionValidation>;
export type TemplateField = z.infer<typeof TemplateFieldValidation>;
export type TemplateCreateInput = z.infer<typeof TemplateCreateValidation>;
