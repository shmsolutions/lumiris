import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { Env } from '@/libs/Env';
import {
  anamnesisSchema,
  appointmentSchema,
  patientSchema,
  sessionNoteSchema,
  treatmentPlanSchema,
} from '@/models/Schema';

const SEED_NAME = 'Helena Ribeiro (exemplo)';

const isoDaysAgo = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
};

/**
 * Dev-only seed: creates one fully-populated sample patient owned by the
 * current user, so the AI report generation can be tested without manual entry.
 * Visit /api/dev/seed while logged in.
 */
export const GET = async () => {
  if (Env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'not_available' }, { status: 404 });
  }

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  // Clean any previous seed for this user (cascade removes related rows).
  await db
    .delete(patientSchema)
    .where(and(eq(patientSchema.ownerId, userId), eq(patientSchema.fullName, SEED_NAME)));

  const [patient] = await db
    .insert(patientSchema)
    .values({
      ownerId: userId,
      fullName: SEED_NAME,
      birthDate: '2018-03-14',
      guardianName: 'Mariana Ribeiro',
      guardianRelation: 'Mãe',
      contactPhone: '(48) 99999-0000',
      contactEmail: 'mariana@example.com',
      gender: 'Feminino',
      maritalStatus: 'Solteira',
      naturality: 'Florianópolis - SC',
      profession: 'Estudante',
      residentialAddress: 'Rua das Acácias, 123 - Florianópolis/SC',
      diagnosis: 'Transtorno do Espectro Autista (apoio leve a moderado)',
      cid: 'F84.0',
      mainComplaint:
        'Dificuldades em motricidade fina e processamento sensorial, com impacto nas atividades escolares.',
      school: 'EMEI Pequeno Príncipe',
      otherProfessionals: 'Fonoaudióloga (semanal), Psicóloga (quinzenal)',
    })
    .returning({ id: patientSchema.id });

  const patientId = patient!.id;

  await db.insert(anamnesisSchema).values({
    patientId,
    ownerId: userId,
    data: {
      identification: {
        handedness: 'Destra',
        gestationalAge: '38 semanas',
        birthType: 'Cesárea',
        birthWeight: '3,1 kg',
        referredBy: 'Neuropediatra',
      },
      clinicalHistory: {
        mainComplaint:
          'Dificuldade em segurar lápis e usar tesoura; baixa tolerância a sons altos e a algumas texturas.',
        complaintOnset: 'Percebido desde os 3 anos, intensificado na entrada escolar.',
        medicalDiagnosis: 'TEA (F84.0), confirmado aos 4 anos.',
        previousTreatments: 'Acompanhamento fonoaudiológico desde os 4 anos.',
        medications: 'Nenhuma em uso contínuo.',
        surgeries: 'Nenhuma.',
        allergies: 'Sem alergias conhecidas.',
      },
      habits: {
        sleep: 'Dorme bem, ~10h/noite.',
        feeding: 'Seletividade alimentar moderada (recusa texturas pastosas).',
        hygiene: 'Independente com supervisão.',
        leisure: 'Gosta de desenhar e brincar com blocos.',
        socialInteraction: 'Prefere brincar sozinha; interage melhor em grupos pequenos.',
        schoolPerformance: 'Acompanha a turma com apoio; dispersa em tarefas longas.',
      },
      developmentalHistory: {
        motor: 'Marcha aos 14 meses; coordenação motora grossa adequada.',
        language: 'Linguagem funcional, com atraso leve na pragmática.',
        cognitive: 'Boa memória visual; atenção sustentada reduzida.',
        social: 'Em desenvolvimento; melhora com mediação.',
      },
      familyHistory: {
        familyStructure: 'Mora com a mãe e avó materna.',
        similarConditions: 'Primo com TEA.',
        observations: 'Família engajada no tratamento.',
      },
      initialAssessment: {
        generalImpression: 'Criança colaborativa, responde bem a reforço positivo.',
        posture: 'Adequada.',
        coordination: 'Déficit em coordenação motora fina.',
        sensoryProcessing: 'Hipersensibilidade auditiva e tátil.',
        activitiesOfDailyLiving: 'Parcialmente independente.',
        observations: 'Beneficia-se de antecipação de rotina.',
      },
      clinicalExam: {
        physical: 'Tônus adequado, sem alterações ortopédicas.',
        educational: 'Necessita de apoio para tarefas de recorte e escrita.',
        social: 'Interação mediada favorece participação.',
      },
      complementaryExams: { results: 'Audiometria normal. Sem exames de imagem recentes.' },
      otDiagnosis: {
        text: 'Déficit no desempenho ocupacional escolar relacionado a disfunção de integração sensorial e imaturidade da motricidade fina.',
      },
      otPrognosis: {
        text: 'Favorável com intervenção regular; expectativa de ganhos em motricidade fina e regulação sensorial em 3-6 meses.',
      },
    },
  });

  const objectives = [
    {
      id: crypto.randomUUID(),
      title: 'Melhorar pinça superior em atividades de recorte',
      description: 'Atividades graduadas de recorte e preensão para desenvolver pinça superior.',
      status: 'active' as const,
      estimatedSessions: 12,
    },
    {
      id: crypto.randomUUID(),
      title: 'Ampliar tolerância a estímulos sensoriais',
      description: 'Programa de integração sensorial com exposição gradual a texturas e sons.',
      status: 'active' as const,
      estimatedSessions: 12,
    },
    {
      id: crypto.randomUUID(),
      title: 'Desenvolver atenção sustentada em tarefas de mesa',
      description: 'Tarefas estruturadas com aumento progressivo de duração.',
      status: 'active' as const,
      estimatedSessions: 10,
    },
  ];

  await db.insert(treatmentPlanSchema).values({
    patientId,
    ownerId: userId,
    frequency: '2x por semana',
    procedures:
      'Integração sensorial, atividades de vida diária, treino de motricidade fina e atenção.',
    notes: 'Plano revisado a cada 3 meses junto à família.',
    objectives,
  });

  const o0 = objectives[0]!.id;
  const o1 = objectives[1]!.id;
  const o2 = objectives[2]!.id;

  const notes = [
    {
      days: 84,
      objective: 'Circuito de integração sensorial e atividades de pinça com massinha.',
      assessment: 'Tolerou bem o circuito. Pinça ainda imatura, fadiga rápida.',
      plan: 'Progredir gradação de recorte na próxima sessão.',
      linked: [o0, o1],
      intercorrencia: '',
    },
    {
      days: 77,
      objective: 'Atividades de recorte em linha reta com tesoura adaptada.',
      assessment: 'Recortou com apoio; melhora na coordenação bimanual.',
      plan: 'Introduzir recorte em curva.',
      linked: [o0],
      intercorrencia: '',
    },
    {
      days: 70,
      objective: 'Exposição a texturas (gel, areia cinética) e sons graduados.',
      assessment: 'Recusou inicialmente o gel; aceitou após mediação.',
      plan: 'Manter exposição gradual, reforço positivo.',
      linked: [o1],
      intercorrencia: 'Episódio breve de recusa a estímulo auditivo (liquidificador no corredor).',
    },
    {
      days: 56,
      objective: 'Tarefa de mesa com encaixe e quebra-cabeça (10 min).',
      assessment: 'Sustentou atenção por ~7 min com pausas. Boa memória visual.',
      plan: 'Aumentar duração para 12 min.',
      linked: [o2],
      intercorrencia: '',
    },
    {
      days: 49,
      objective: 'Recorte em curva e colagem direcionada.',
      assessment: 'Recortou curvas simples com menor fadiga. Evolução na pinça.',
      plan: 'Introduzir recorte de figuras.',
      linked: [o0],
      intercorrencia: '',
    },
    {
      days: 35,
      objective: 'Integração sensorial com prancha de equilíbrio e texturas variadas.',
      assessment: 'Maior tolerância tátil. Participou de todas as estações.',
      plan: 'Incluir sons ambientais durante a tarefa.',
      linked: [o1, o2],
      intercorrencia: '',
    },
    {
      days: 21,
      objective: 'Tarefa de mesa estruturada (12 min) com reforço visual.',
      assessment: 'Sustentou atenção por 11 min. Dispersa em transições.',
      plan: 'Trabalhar antecipação de transições.',
      linked: [o2],
      intercorrencia: '',
    },
    {
      days: 7,
      objective: 'Recorte de figuras e colagem; revisão de tolerância sensorial.',
      assessment: 'Recorta figuras simples com supervisão leve. Boa regulação sensorial na sessão.',
      plan: 'Manter plano; reavaliar objetivos no próximo trimestre.',
      linked: [o0, o1],
      intercorrencia: '',
    },
  ];

  await db.insert(sessionNoteSchema).values(
    notes.map((n) => ({
      patientId,
      ownerId: userId,
      sessionDate: isoDaysAgo(n.days),
      procedimento: n.objective,
      intercorrencia: n.intercorrencia || null,
      evolucao: `${n.assessment} ${n.plan}`.trim(),
      transcript: '',
      rawText: '',
      linkedObjectives: n.linked,
    })),
  );

  // A couple of upcoming appointments too.
  const upcoming = new Date();
  upcoming.setDate(upcoming.getDate() + 1);
  upcoming.setHours(14, 0, 0, 0);
  await db.insert(appointmentSchema).values({
    patientId,
    ownerId: userId,
    startsAt: upcoming,
    durationMinutes: 50,
    status: 'scheduled',
    notes: 'Continuar recorte de figuras.',
  });

  return NextResponse.json({
    ok: true,
    patientId,
    message: 'Paciente de exemplo criado com anamnese, plano (3 objetivos) e 8 evoluções.',
    next: `/dashboard/patients/${patientId}/reports/new`,
  });
};
