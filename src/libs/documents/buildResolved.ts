import type { TemplateValues } from '@/libs/TemplateSchema';
import type { TemplateDefinition } from '@/validations/TemplateValidation';
import type { ResolvedDocument, ResolvedSection, ResolvedSignature } from './types';

type Therapist = { name: string; crefito: string; studentName: string | null };

const FOOTER = 'lumiris · prontuário inteligente';

const signatures = (
  therapist: Therapist,
  therapistLine: string,
  studentLine: string,
  signatureImageDataUrl?: string | null,
): ResolvedSignature[] => {
  const list: ResolvedSignature[] = [
    {
      name: therapist.crefito ? `${therapist.name} — CREFITO ${therapist.crefito}` : therapist.name,
      caption: therapistLine,
      ...(signatureImageDataUrl ? { imageDataUrl: signatureImageDataUrl } : {}),
    },
  ];
  if (therapist.studentName) {
    list.push({ name: therapist.studentName, caption: studentLine });
  }
  return list;
};

type SessionNoteArgs = {
  patientName: string;
  sessionDateLabel: string;
  birthDate: string | null;
  cid: string | null;
  procedures: string;
  intercorrencia: string;
  evolution: string;
  transcript: string | null;
  therapist: Therapist;
  signatureImageDataUrl?: string | null;
  labels: {
    title: string;
    reference: string;
    session_date: string;
    born: string;
    cid: string;
    section_evolution: string;
    field_procedures: string;
    field_intercorrencia: string;
    field_evolution: string;
    transcript_title: string;
    therapist_line: string;
    student_line: string;
    empty_field: string;
  };
};

export const buildSessionNoteResolved = (args: SessionNoteArgs): ResolvedDocument => {
  const l = args.labels;
  const metaItems = [
    { label: l.session_date, value: args.sessionDateLabel },
    { label: 'Paciente', value: args.patientName },
    ...(args.birthDate ? [{ label: l.born, value: args.birthDate }] : []),
    ...(args.cid ? [{ label: l.cid, value: args.cid }] : []),
  ];

  return {
    title: l.title,
    reference: l.reference,
    patientName: args.patientName,
    metaItems,
    sections: [
      {
        kind: 'narrative',
        title: l.section_evolution,
        fields: [
          { label: l.field_procedures, value: args.procedures },
          { label: l.field_intercorrencia, value: args.intercorrencia },
          { label: l.field_evolution, value: args.evolution },
        ],
      },
      ...(args.transcript?.trim()
        ? [
            {
              kind: 'narrative' as const,
              title: l.transcript_title,
              fields: [{ label: '', value: args.transcript }],
            },
          ]
        : []),
    ],
    signatures: signatures(
      args.therapist,
      l.therapist_line,
      l.student_line,
      args.signatureImageDataUrl,
    ),
    footer: FOOTER,
    emptyLabel: l.empty_field,
  };
};

type ReportArgs = {
  patientName: string;
  periodLabel: string;
  cid: string | null;
  content: {
    initialComplaint: string;
    generalEvolution: string;
    objectiveProgress: { title: string; progress: string }[];
    difficulties: string;
    suggestions: string;
    conclusion: string;
  };
  therapist: Therapist;
  signatureImageDataUrl?: string | null;
  labels: {
    title: string;
    period: string;
    cid: string;
    initial_complaint: string;
    general_evolution: string;
    objective_progress: string;
    difficulties: string;
    suggestions: string;
    conclusion: string;
    therapist_line: string;
    student_line: string;
    empty: string;
  };
};

export const buildReportResolved = (args: ReportArgs): ResolvedDocument => {
  const l = args.labels;
  const c = args.content;

  return {
    title: l.title,
    patientName: args.patientName,
    metaItems: [
      { label: 'Paciente', value: args.patientName },
      { label: l.period, value: args.periodLabel },
      ...(args.cid ? [{ label: l.cid, value: args.cid }] : []),
    ],
    sections: [
      {
        kind: 'narrative',
        title: l.initial_complaint,
        fields: [{ label: '', value: c.initialComplaint }],
      },
      {
        kind: 'narrative',
        title: l.general_evolution,
        fields: [{ label: '', value: c.generalEvolution }],
      },
      {
        kind: 'narrative',
        title: l.objective_progress,
        fields: c.objectiveProgress.map((o) => ({ label: o.title, value: o.progress })),
      },
      { kind: 'narrative', title: l.difficulties, fields: [{ label: '', value: c.difficulties }] },
      { kind: 'narrative', title: l.suggestions, fields: [{ label: '', value: c.suggestions }] },
      { kind: 'narrative', title: l.conclusion, fields: [{ label: '', value: c.conclusion }] },
    ],
    signatures: signatures(
      args.therapist,
      l.therapist_line,
      l.student_line,
      args.signatureImageDataUrl,
    ),
    footer: FOOTER,
    emptyLabel: l.empty,
  };
};

type AnamnesisArgs = {
  patient: {
    fullName: string;
    age: string;
    naturality: string;
    maritalStatus: string;
    gender: string;
    profession: string;
    residentialAddress: string;
    commercialAddress: string;
  };
  clinicalHistory: {
    mainComplaint: string;
    diseaseHistory: string;
    lifeHabits: string;
    treatments: string;
    antecedents: string;
    others: string;
  };
  clinicalExam: string;
  complementaryExams: string;
  otDiagnosis: string;
  otPrognosis: string;
  plan: {
    frequency: string;
    objectives: { title: string; estimatedSessions: number; procedures: string }[];
  };
  therapist: Therapist;
  signatureImageDataUrl?: string | null;
  labels: {
    title: string;
    reference: string;
    field_frequency: string;
    section_identification: string;
    field_full_name: string;
    field_age: string;
    field_naturality: string;
    field_marital_status: string;
    field_gender: string;
    field_profession: string;
    field_residential_address: string;
    field_commercial_address: string;
    section_clinical_history: string;
    field_main_complaint: string;
    field_disease_history: string;
    field_life_habits: string;
    field_treatments: string;
    field_antecedents: string;
    field_others: string;
    section_clinical_exam: string;
    section_complementary_exams: string;
    section_ot_diagnosis: string;
    section_ot_prognosis: string;
    section_plan: string;
    plan_objectives: string;
    plan_sessions: string;
    plan_procedures: string;
    therapist_line: string;
    student_line: string;
    empty_field: string;
  };
};

export const buildAnamnesisResolved = (args: AnamnesisArgs): ResolvedDocument => {
  const l = args.labels;
  const p = args.patient;
  const ch = args.clinicalHistory;

  return {
    title: l.title,
    reference: l.reference,
    patientName: p.fullName,
    metaItems: args.plan.frequency
      ? [{ label: l.field_frequency, value: args.plan.frequency }]
      : [],
    sections: [
      {
        kind: 'header',
        title: l.section_identification,
        fields: [
          { label: l.field_full_name, value: p.fullName },
          { label: l.field_age, value: p.age },
          { label: l.field_naturality, value: p.naturality },
          { label: l.field_marital_status, value: p.maritalStatus },
          { label: l.field_gender, value: p.gender },
          { label: l.field_profession, value: p.profession },
          { label: l.field_residential_address, value: p.residentialAddress },
          { label: l.field_commercial_address, value: p.commercialAddress },
        ],
      },
      {
        kind: 'narrative',
        title: l.section_clinical_history,
        fields: [
          { label: l.field_main_complaint, value: ch.mainComplaint },
          { label: l.field_disease_history, value: ch.diseaseHistory },
          { label: l.field_life_habits, value: ch.lifeHabits },
          { label: l.field_treatments, value: ch.treatments },
          { label: l.field_antecedents, value: ch.antecedents },
          { label: l.field_others, value: ch.others },
        ],
      },
      {
        kind: 'narrative',
        title: l.section_clinical_exam,
        fields: [{ label: '', value: args.clinicalExam }],
      },
      {
        kind: 'narrative',
        title: l.section_complementary_exams,
        fields: [{ label: '', value: args.complementaryExams }],
      },
      {
        kind: 'narrative',
        title: l.section_ot_diagnosis,
        fields: [{ label: '', value: args.otDiagnosis }],
      },
      {
        kind: 'narrative',
        title: l.section_ot_prognosis,
        fields: [{ label: '', value: args.otPrognosis }],
      },
      {
        kind: 'objectives',
        title: l.section_plan,
        columns: [l.plan_objectives, l.plan_sessions, l.plan_procedures],
        rows: args.plan.objectives.map((o) => [
          o.title,
          o.estimatedSessions > 0 ? String(o.estimatedSessions) : '',
          o.procedures,
        ]),
      },
    ],
    signatures: signatures(
      args.therapist,
      l.therapist_line,
      l.student_line,
      args.signatureImageDataUrl,
    ),
    footer: FOOTER,
    emptyLabel: l.empty_field,
  };
};

type TemplateContext = {
  title: string;
  reference?: string;
  emptyLabel: string;
  therapistLine: string;
  studentLine: string;
  therapist: Therapist;
  signatureImageDataUrl?: string | null;
  patient: { fullName: string; birthDate: string; diagnosis: string; cid: string };
  today: string;
  periodStart: string;
  periodEnd: string;
  sessionDate: string;
};

const autoValues = (ctx: TemplateContext): Record<string, string> => ({
  auto_patient_name: ctx.patient.fullName,
  auto_patient_birthdate: ctx.patient.birthDate,
  auto_patient_diagnosis: ctx.patient.diagnosis,
  auto_patient_cid: ctx.patient.cid,
  auto_therapist_name: ctx.therapist.name,
  auto_crefito: ctx.therapist.crefito,
  auto_student_name: ctx.therapist.studentName ?? '',
  auto_today: ctx.today,
  auto_period_start: ctx.periodStart,
  auto_period_end: ctx.periodEnd,
  auto_session_date: ctx.sessionDate,
});

/** Monta um ResolvedDocument a partir de um modelo custom + valores capturados. */
export const buildResolvedFromTemplate = (
  definition: TemplateDefinition,
  values: TemplateValues,
  ctx: TemplateContext,
): ResolvedDocument => {
  const auto = autoValues(ctx);

  const fieldValue = (fillMode: string, key: string): string => {
    if (fillMode !== 'manual') {
      return auto[fillMode] ?? '';
    }
    const raw = values[key];
    return typeof raw === 'string' ? raw : '';
  };

  const sections: ResolvedSection[] = definition.sections.map((section) => {
    if (section.type === 'objectives_table') {
      const rows = Array.isArray(values[section.key])
        ? (values[section.key] as { title: string; progress: string }[])
        : [];
      return {
        kind: 'objectives',
        title: section.title,
        columns: section.fields.map((f) => f.label),
        rows: rows.map((row) =>
          section.fields.map((col) => {
            const cell = (row as Record<string, unknown>)[col.key];
            return typeof cell === 'string' ? cell : '';
          }),
        ),
      };
    }
    const fields = section.fields.map((f) => ({
      label: f.label,
      value: fieldValue(f.fillMode, f.key),
    }));
    return section.type === 'header'
      ? { kind: 'header', title: section.title, fields }
      : { kind: 'narrative', title: section.title, fields };
  });

  return {
    title: ctx.title,
    reference: ctx.reference,
    patientName: ctx.patient.fullName,
    metaItems: [],
    sections,
    signatures: signatures(
      ctx.therapist,
      ctx.therapistLine,
      ctx.studentLine,
      ctx.signatureImageDataUrl,
    ),
    footer: FOOTER,
    emptyLabel: ctx.emptyLabel,
  };
};
