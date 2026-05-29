import * as z from 'zod';

/**
 * Anamnese estruturada baseada no modelo CREFITO para TO.
 * Todos os campos são opcionais — o terapeuta preenche conforme a consulta evolui.
 */
export const AnamnesisDataValidation = z.object({
  identification: z
    .object({
      handedness: z.string().optional(),
      gestationalAge: z.string().optional(),
      birthType: z.string().optional(),
      birthWeight: z.string().optional(),
      referredBy: z.string().optional(),
    })
    .default({}),
  clinicalHistory: z
    .object({
      mainComplaint: z.string().optional(),
      complaintOnset: z.string().optional(),
      medicalDiagnosis: z.string().optional(),
      previousTreatments: z.string().optional(),
      medications: z.string().optional(),
      surgeries: z.string().optional(),
      allergies: z.string().optional(),
    })
    .default({}),
  habits: z
    .object({
      sleep: z.string().optional(),
      feeding: z.string().optional(),
      hygiene: z.string().optional(),
      leisure: z.string().optional(),
      socialInteraction: z.string().optional(),
      schoolPerformance: z.string().optional(),
    })
    .default({}),
  developmentalHistory: z
    .object({
      motor: z.string().optional(),
      language: z.string().optional(),
      cognitive: z.string().optional(),
      social: z.string().optional(),
    })
    .default({}),
  familyHistory: z
    .object({
      familyStructure: z.string().optional(),
      similarConditions: z.string().optional(),
      observations: z.string().optional(),
    })
    .default({}),
  initialAssessment: z
    .object({
      generalImpression: z.string().optional(),
      posture: z.string().optional(),
      coordination: z.string().optional(),
      sensoryProcessing: z.string().optional(),
      activitiesOfDailyLiving: z.string().optional(),
      observations: z.string().optional(),
    })
    .default({}),
  clinicalExam: z
    .object({
      physical: z.string().optional(),
      educational: z.string().optional(),
      social: z.string().optional(),
    })
    .default({}),
  complementaryExams: z
    .object({
      results: z.string().optional(),
    })
    .default({}),
  otDiagnosis: z
    .object({
      text: z.string().optional(),
    })
    .default({}),
  otPrognosis: z
    .object({
      text: z.string().optional(),
    })
    .default({}),
});

const TemplateValuesValidation = z.record(
  z.string(),
  z.union([z.string(), z.array(z.object({ title: z.string(), progress: z.string() }))]),
);

export const AnamnesisUpsertValidation = z.object({
  data: AnamnesisDataValidation.optional(),
  templateId: z.uuid().nullable().optional(),
  values: TemplateValuesValidation.optional(),
});

export type AnamnesisData = z.infer<typeof AnamnesisDataValidation>;
