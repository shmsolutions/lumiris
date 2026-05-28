import { auth, currentUser } from '@clerk/nextjs/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { and, eq } from 'drizzle-orm';
import { getTranslations } from 'next-intl/server';
import { NextResponse } from 'next/server';
import { AvaliacaoPDF } from '@/components/pdf/AvaliacaoPDF';
import { db } from '@/libs/DB';
import { getUserProfile } from '@/libs/UserProfile';
import { anamnesisSchema, patientSchema, treatmentPlanSchema } from '@/models/Schema';
import { AnamnesisDataValidation } from '@/validations/AnamnesisValidation';
import type { AnamnesisData } from '@/validations/AnamnesisValidation';
import { TreatmentPlanUpsertValidation } from '@/validations/TreatmentPlanValidation';

type RouteContext = { params: Promise<{ id: string }> };

const slug = (name: string) =>
  name
    .normalize('NFD')
    .replaceAll(/\p{Diacritic}/gu, '')
    .replaceAll(/[^a-zA-Z0-9]+/g, '-')
    .replaceAll(/^-+|-+$/g, '')
    .toLowerCase() || 'paciente';

const computeAge = (birthDate: string | null, suffix: string) => {
  if (!birthDate) {
    return '';
  }
  const b = new Date(`${birthDate}T12:00:00`);
  if (Number.isNaN(b.getTime())) {
    return '';
  }
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) {
    age -= 1;
  }
  return age >= 0 ? `${age} ${suffix}` : '';
};

const joinLabeled = (entries: [string, string | undefined][]) =>
  entries
    .filter(([, v]) => v?.trim())
    .map(([label, v]) => `${label}: ${(v as string).trim()}`)
    .join('\n');

export const GET = async (request: Request, context: RouteContext) => {
  const { userId } = await auth();
  const { id } = await context.params;

  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const [patient] = await db
    .select()
    .from(patientSchema)
    .where(and(eq(patientSchema.id, id), eq(patientSchema.ownerId, userId)))
    .limit(1);

  if (!patient) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const [anamnesisRow] = await db
    .select()
    .from(anamnesisSchema)
    .where(eq(anamnesisSchema.patientId, id))
    .limit(1);

  const parsed = AnamnesisDataValidation.safeParse(anamnesisRow?.data ?? {});
  const data: AnamnesisData = parsed.success ? parsed.data : AnamnesisDataValidation.parse({});

  const [planRow] = await db
    .select()
    .from(treatmentPlanSchema)
    .where(eq(treatmentPlanSchema.patientId, id))
    .limit(1);
  const objectives = TreatmentPlanUpsertValidation.shape.objectives.parse(
    planRow?.objectives ?? [],
  );

  const localeParam = new URL(request.url).searchParams.get('locale');
  const locale = localeParam === 'en' ? 'en' : 'pt-BR';

  const tForm = await getTranslations({ locale, namespace: 'AnamnesisForm' });
  const tPdf = await getTranslations({ locale, namespace: 'AvaliacaoPdf' });

  const profile = await getUserProfile(userId);
  const user = await currentUser().catch(() => null);
  const therapistName =
    profile.therapistName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() ||
    user?.primaryEmailAddress?.emailAddress ||
    '';

  const generatedAt = new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date());

  // Map Lume's granular anamnesis into CREFITO's história clínica fields.
  const diseaseHistory = joinLabeled([
    [tForm('field_clinicalHistory_complaintOnset'), data.clinicalHistory.complaintOnset],
    [tForm('field_clinicalHistory_medicalDiagnosis'), data.clinicalHistory.medicalDiagnosis],
    [tForm('field_clinicalHistory_medications'), data.clinicalHistory.medications],
    [tForm('field_clinicalHistory_surgeries'), data.clinicalHistory.surgeries],
    [tForm('field_clinicalHistory_allergies'), data.clinicalHistory.allergies],
  ]);

  const lifeHabits = joinLabeled([
    [tForm('field_habits_sleep'), data.habits.sleep],
    [tForm('field_habits_feeding'), data.habits.feeding],
    [tForm('field_habits_hygiene'), data.habits.hygiene],
    [tForm('field_habits_leisure'), data.habits.leisure],
    [tForm('field_habits_socialInteraction'), data.habits.socialInteraction],
    [tForm('field_habits_schoolPerformance'), data.habits.schoolPerformance],
  ]);

  const antecedents = joinLabeled([
    [tForm('field_familyHistory_familyStructure'), data.familyHistory.familyStructure],
    [tForm('field_familyHistory_similarConditions'), data.familyHistory.similarConditions],
    [tForm('field_familyHistory_observations'), data.familyHistory.observations],
    [tForm('field_identification_gestationalAge'), data.identification.gestationalAge],
    [tForm('field_identification_birthType'), data.identification.birthType],
    [tForm('field_identification_birthWeight'), data.identification.birthWeight],
  ]);

  const others = joinLabeled([
    [tForm('field_identification_handedness'), data.identification.handedness],
    [tForm('field_identification_referredBy'), data.identification.referredBy],
    [tForm('field_developmentalHistory_motor'), data.developmentalHistory.motor],
    [tForm('field_developmentalHistory_language'), data.developmentalHistory.language],
    [tForm('field_developmentalHistory_cognitive'), data.developmentalHistory.cognitive],
    [tForm('field_developmentalHistory_social'), data.developmentalHistory.social],
  ]);

  // Clinical exam: dedicated section first, fallback to initial assessment.
  const clinicalExam =
    joinLabeled([
      [tForm('field_clinicalExam_physical'), data.clinicalExam.physical],
      [tForm('field_clinicalExam_educational'), data.clinicalExam.educational],
      [tForm('field_clinicalExam_social'), data.clinicalExam.social],
    ]) ||
    joinLabeled([
      [
        tForm('field_initialAssessment_generalImpression'),
        data.initialAssessment.generalImpression,
      ],
      [tForm('field_initialAssessment_posture'), data.initialAssessment.posture],
      [tForm('field_initialAssessment_coordination'), data.initialAssessment.coordination],
      [
        tForm('field_initialAssessment_sensoryProcessing'),
        data.initialAssessment.sensoryProcessing,
      ],
      [
        tForm('field_initialAssessment_activitiesOfDailyLiving'),
        data.initialAssessment.activitiesOfDailyLiving,
      ],
      [tForm('field_initialAssessment_observations'), data.initialAssessment.observations],
    ]);

  const pdfBuffer = await renderToBuffer(
    <AvaliacaoPDF
      generatedAtLabel={tPdf('generated_at', { datetime: generatedAt })}
      patient={{
        fullName: patient.fullName,
        age: computeAge(patient.birthDate, tPdf('age_suffix')),
        naturality: patient.naturality ?? '',
        maritalStatus: patient.maritalStatus ?? '',
        gender: patient.gender ?? '',
        profession: patient.profession ?? '',
        residentialAddress: patient.residentialAddress ?? '',
        commercialAddress: patient.commercialAddress ?? '',
      }}
      clinicalHistory={{
        mainComplaint: data.clinicalHistory.mainComplaint || patient.mainComplaint || '',
        diseaseHistory,
        lifeHabits,
        treatments: data.clinicalHistory.previousTreatments ?? '',
        antecedents,
        others,
      }}
      clinicalExam={clinicalExam}
      complementaryExams={data.complementaryExams.results ?? ''}
      otDiagnosis={data.otDiagnosis.text ?? ''}
      otPrognosis={data.otPrognosis.text ?? ''}
      plan={{
        frequency: planRow?.frequency ?? '',
        objectives: objectives.map((o) => ({
          title: o.title,
          estimatedSessions: o.estimatedSessions,
          procedures: o.description ?? '',
        })),
      }}
      therapist={{
        name: therapistName,
        crefito: profile.crefito,
        studentName: profile.studentName || null,
      }}
      labels={{
        title: tPdf('title'),
        reference: tPdf('reference'),
        section_identification: tPdf('section_identification'),
        section_clinical_history: tPdf('section_clinical_history'),
        section_clinical_exam: tPdf('section_clinical_exam'),
        section_complementary_exams: tPdf('section_complementary_exams'),
        section_ot_diagnosis: tPdf('section_ot_diagnosis'),
        section_ot_prognosis: tPdf('section_ot_prognosis'),
        section_plan: tPdf('section_plan'),
        field_full_name: tPdf('field_full_name'),
        field_age: tPdf('field_age'),
        field_naturality: tPdf('field_naturality'),
        field_marital_status: tPdf('field_marital_status'),
        field_gender: tPdf('field_gender'),
        field_profession: tPdf('field_profession'),
        field_residential_address: tPdf('field_residential_address'),
        field_commercial_address: tPdf('field_commercial_address'),
        field_main_complaint: tPdf('field_main_complaint'),
        field_disease_history: tPdf('field_disease_history'),
        field_life_habits: tPdf('field_life_habits'),
        field_treatments: tPdf('field_treatments'),
        field_antecedents: tPdf('field_antecedents'),
        field_others: tPdf('field_others'),
        field_frequency: tPdf('field_frequency'),
        plan_objectives: tPdf('plan_objectives'),
        plan_sessions: tPdf('plan_sessions'),
        plan_procedures: tPdf('plan_procedures'),
        therapist_line: tPdf('therapist_line'),
        student_line: tPdf('student_line'),
        empty_field: tPdf('empty_field'),
      }}
    />,
  );

  const filename = `avaliacao-${slug(patient.fullName)}.pdf`;

  return new NextResponse(pdfBuffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
};
