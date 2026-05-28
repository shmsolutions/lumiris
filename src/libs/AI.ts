import OpenAI, { toFile } from 'openai';
import { Env } from '@/libs/Env';
import { logger } from '@/libs/Logger';

/** Text model used for structuring (SOAP) and report generation. */
const TEXT_MODEL = 'gpt-4.1-mini';
/** Speech-to-text model used to transcribe session audio (webm/opus from MediaRecorder). */
const STT_MODEL = 'gpt-4o-mini-transcribe';

/** Extract a readable detail from an OpenAI/SDK error for logging. */
const describeError = (error: unknown): string => {
  if (error instanceof OpenAI.APIError) {
    const body = typeof error.error === 'object' ? JSON.stringify(error.error) : '';
    return `status=${error.status} code=${error.code ?? ''} type=${error.type ?? ''} message=${error.message} body=${body}`;
  }
  return (error as Error)?.message ?? String(error);
};

export type EvolutionDraft = {
  procedimento: string;
  intercorrencia: string;
  evolucao: string;
};

export type ReportObjectiveProgress = { title: string; progress: string };

export type ReportContent = {
  initialComplaint: string;
  generalEvolution: string;
  objectiveProgress: ReportObjectiveProgress[];
  difficulties: string;
  suggestions: string;
  conclusion: string;
};

/** Source material the report generator reads from. */
export type ReportSource = {
  patientName: string;
  mainComplaint: string;
  anamnesisSummary: string;
  objectives: { title: string; description: string; status: string }[];
  notes: {
    date: string;
    procedimento: string;
    intercorrencia: string;
    evolucao: string;
    linkedObjectiveTitles: string[];
  }[];
  periodStart: string;
  periodEnd: string;
};

export type DraftResult = {
  transcript: string;
  evolution: EvolutionDraft;
  /** Source of the transcript ('audio' = Whisper, 'text' = passthrough, 'mock' = local mock). */
  transcriptSource: 'audio' | 'text' | 'mock';
  /** Did the model actually structure the fields, or did we fall back to empty ones? */
  structured: boolean;
};

const MOCK_DRAFT: DraftResult = {
  transcript:
    'Hoje a Helena chegou disposta. Trabalhamos integração sensorial com circuito de obstáculos. Boa coordenação motora grossa, ainda com dificuldade em motricidade fina, principalmente no uso da pinça superior. Mãe relatou melhora na rotina escolar nas últimas duas semanas. Para a próxima, vou focar em atividades de recorte e colagem para reforçar pinça e atenção sustentada.',
  evolution: {
    procedimento:
      'Realizado circuito de obstáculos para integração sensorial, com atividades de coordenação motora grossa e estímulo de motricidade fina (uso da pinça superior).',
    intercorrencia: 'Sem intercorrências.',
    evolucao:
      'Paciente chegou disposta e participativa. Coordenação motora grossa preservada; mantém dificuldade em motricidade fina, especialmente no uso da pinça superior. Mãe relatou melhora na rotina escolar nas últimas duas semanas. Evolução positiva em integração sensorial e atenção sustentada. Próximo foco: recorte e colagem para reforço de pinça e atenção sustentada.',
  },
  transcriptSource: 'mock',
  structured: true,
};

const isMockMode = () => Env.LUME_AI_MOCK || !Env.OPENAI_API_KEY;

let openaiClient: OpenAI | null = null;

const getOpenAI = () => {
  if (!Env.OPENAI_API_KEY) {
    return null;
  }
  openaiClient ??= new OpenAI({ apiKey: Env.OPENAI_API_KEY });
  return openaiClient;
};

const STRUCTURE_SYSTEM_PROMPT = `Você é um assistente clínico que ajuda Terapeutas Ocupacionais (TOs) brasileiras a estruturar evoluções de sessão para o prontuário (padrão CREFITO), a partir de transcrições de áudio ou texto livre.

Diretrizes:
- Estruture em três campos: Procedimento, Intercorrência e Evolução do estado de saúde.
- Procedimento: o que foi realizado na sessão — atividades, técnicas e condutas aplicadas. Linguagem técnica de TO, objetiva.
- Intercorrência: qualquer evento atípico durante a sessão (recusa, mal-estar, alteração de comportamento, evento clínico). Se não houve, escreva "Sem intercorrências".
- Evolução do estado de saúde: análise clínica da TO sobre a resposta e o progresso do paciente — o que evoluiu, o que persiste, hipóteses e direcionamento.
- Não invente informação que não está na transcrição. Se um campo não tem base, escreva "Sem registro nesta sessão." (a Intercorrência usa "Sem intercorrências").
- Português brasileiro, tom profissional clínico, sem floreios.
- Respeite a fala da TO: se ela usou um termo técnico específico, mantenha.`;

const transcribeWithOpenAI = async (audio: File): Promise<string> => {
  const client = getOpenAI();
  if (!client) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  // Convert the web File into a clean buffer-backed upload to avoid malformed
  // multipart issues when forwarding undici File objects from Next.js.
  const buffer = Buffer.from(await audio.arrayBuffer());
  const filename = audio.name || 'audio.webm';
  const file = await toFile(buffer, filename, {
    type: audio.type || 'audio/webm',
  });

  const response = await client.audio.transcriptions.create({
    file,
    model: STT_MODEL,
    language: 'pt',
    response_format: 'json',
  });

  return response.text;
};

const structureWithOpenAI = async (transcript: string): Promise<EvolutionDraft> => {
  const client = getOpenAI();
  if (!client) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const completion = await client.chat.completions.create({
    model: TEXT_MODEL,
    messages: [
      { role: 'system', content: STRUCTURE_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Estruture a seguinte transcrição em Procedimento, Intercorrência e Evolução do estado de saúde:\n\n${transcript}`,
      },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'evolution_note',
        strict: true,
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            procedimento: { type: 'string' },
            intercorrencia: { type: 'string' },
            evolucao: { type: 'string' },
          },
          required: ['procedimento', 'intercorrencia', 'evolucao'],
        },
      },
    },
  });

  const content = completion.choices[0]?.message.content;
  if (!content) {
    throw new Error('OpenAI did not return a structured evolution');
  }

  const input = JSON.parse(content) as EvolutionDraft;
  return {
    procedimento: input.procedimento ?? '',
    intercorrencia: input.intercorrencia ?? '',
    evolucao: input.evolucao ?? '',
  };
};

const emptyEvolution = (): EvolutionDraft => ({
  procedimento: '',
  intercorrencia: '',
  evolucao: '',
});

/**
 * Build a draft from raw audio. Transcribes (whisper-1) then structures
 * (gpt-4.1-mini). Falls back gracefully — never loses the input.
 */
export const buildDraftFromAudio = async (audio: File): Promise<DraftResult> => {
  if (isMockMode()) {
    return MOCK_DRAFT;
  }

  let transcript = '';
  const transcriptSource: 'audio' | 'text' = 'audio';

  try {
    transcript = await transcribeWithOpenAI(audio);
  } catch (error) {
    logger.error(
      `Transcription failed [${audio.type || 'unknown'} · ${audio.size} bytes]: ${describeError(error)}`,
    );
    throw new Error('transcription_failed', { cause: error });
  }

  if (!transcript.trim()) {
    return {
      transcript: '',
      evolution: emptyEvolution(),
      transcriptSource,
      structured: false,
    };
  }

  try {
    const evolution = await structureWithOpenAI(transcript);
    return { transcript, evolution, transcriptSource, structured: true };
  } catch (error) {
    logger.error(`Evolution structuring failed: ${describeError(error)}`);
    return {
      transcript,
      evolution: emptyEvolution(),
      transcriptSource,
      structured: false,
    };
  }
};

const REPORT_SYSTEM_PROMPT = `Você é um assistente clínico que ajuda Terapeutas Ocupacionais brasileiras a redigir relatórios de evolução (geralmente trimestrais) para planos de saúde e para o prontuário.

A partir da anamnese, do plano terapêutico (objetivos) e das evoluções de sessão de um período, você produz um relatório estruturado e formal.

Diretrizes:
- Português brasileiro, tom técnico-clínico, formal mas legível.
- Não invente dados. Baseie-se exclusivamente no material fornecido. Se faltar informação para um campo, escreva algo como "Sem dados suficientes no período".
- "Evolução por objetivo": para cada objetivo do plano, descreva o progresso observado nas evoluções vinculadas. Seja específico (cite o que melhorou/persistiu).
- "Dificuldades": barreiras, intercorrências recorrentes, fatores que limitaram o progresso.
- "Sugestões": recomendações concretas para o próximo período.
- "Conclusão": síntese objetiva do estado atual e da continuidade do tratamento.
- A responsabilidade clínica é sempre do terapeuta — você produz um rascunho para revisão.`;

const MOCK_REPORT: ReportContent = {
  initialComplaint:
    'Encaminhada com queixa de dificuldades em motricidade fina e processamento sensorial, com impacto nas atividades escolares e de vida diária.',
  generalEvolution:
    'Ao longo do período, a paciente apresentou evolução consistente na integração sensorial e na atenção sustentada. Houve maior tolerância a estímulos táteis e melhora progressiva na coordenação motora grossa. A motricidade fina segue em desenvolvimento, com ganhos perceptíveis no uso da pinça.',
  objectiveProgress: [
    {
      title: 'Melhorar pinça superior em atividades de recorte',
      progress:
        'Progresso moderado. No início do período não sustentava a pinça superior; ao final, realiza recortes simples com supervisão e menor fadiga.',
    },
    {
      title: 'Ampliar tolerância a estímulos sensoriais',
      progress:
        'Progresso significativo. Reduziu episódios de recusa a texturas e passou a participar de atividades com diferentes materiais.',
    },
  ],
  difficulties:
    'Oscilações de humor em dias de maior demanda escolar e fadiga ao final das sessões longas. Houve uma intercorrência de recusa pontual relacionada a estímulo auditivo intenso.',
  suggestions:
    'Manter o foco em motricidade fina com gradação de dificuldade. Introduzir atividades bilaterais. Orientar a escola quanto a pausas sensoriais. Reavaliar objetivos em 3 meses.',
  conclusion:
    'A paciente evolui de forma favorável e demonstra benefício claro da intervenção em Terapia Ocupacional. Recomenda-se a continuidade do tratamento com a frequência atual.',
};

/**
 * Generate a structured progress report from the gathered source material.
 * Mock mode returns a realistic fixed report.
 */
export const generateReport = async (source: ReportSource): Promise<ReportContent> => {
  if (isMockMode()) {
    return {
      ...MOCK_REPORT,
      objectiveProgress:
        source.objectives.length > 0
          ? source.objectives.map((o) => ({
              title: o.title,
              progress:
                MOCK_REPORT.objectiveProgress[0]?.progress ??
                'Progresso observado ao longo do período.',
            }))
          : MOCK_REPORT.objectiveProgress,
    };
  }

  const client = getOpenAI();
  if (!client) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const notesText = source.notes
    .map(
      (n) =>
        `Sessão ${n.date}${n.linkedObjectiveTitles.length ? ` (objetivos: ${n.linkedObjectiveTitles.join('; ')})` : ''}\n` +
        `Procedimento: ${n.procedimento}\n` +
        `Evolução: ${n.evolucao}\n${n.intercorrencia ? `Intercorrência: ${n.intercorrencia}\n` : ''}`,
    )
    .join('\n---\n');

  const objectivesText = source.objectives
    .map((o) => `- ${o.title}${o.description ? `: ${o.description}` : ''} [${o.status}]`)
    .join('\n');

  const userContent = `Paciente: ${source.patientName}
Período: ${source.periodStart} a ${source.periodEnd}
Queixa principal: ${source.mainComplaint || 'não informada'}

Resumo da anamnese:
${source.anamnesisSummary || 'não informado'}

Objetivos do plano terapêutico:
${objectivesText || 'nenhum objetivo cadastrado'}

Evoluções do período:
${notesText || 'nenhuma evolução registrada no período'}`;

  const completion = await client.chat.completions.create({
    model: TEXT_MODEL,
    messages: [
      { role: 'system', content: REPORT_SYSTEM_PROMPT },
      { role: 'user', content: userContent },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'progress_report',
        strict: true,
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            initialComplaint: { type: 'string' },
            generalEvolution: { type: 'string' },
            objectiveProgress: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  title: { type: 'string' },
                  progress: { type: 'string' },
                },
                required: ['title', 'progress'],
              },
            },
            difficulties: { type: 'string' },
            suggestions: { type: 'string' },
            conclusion: { type: 'string' },
          },
          required: [
            'initialComplaint',
            'generalEvolution',
            'objectiveProgress',
            'difficulties',
            'suggestions',
            'conclusion',
          ],
        },
      },
    },
  });

  const content = completion.choices[0]?.message.content;
  if (!content) {
    throw new Error('OpenAI did not return a structured report');
  }

  const input = JSON.parse(content) as ReportContent;
  return {
    initialComplaint: input.initialComplaint ?? '',
    generalEvolution: input.generalEvolution ?? '',
    objectiveProgress: Array.isArray(input.objectiveProgress) ? input.objectiveProgress : [],
    difficulties: input.difficulties ?? '',
    suggestions: input.suggestions ?? '',
    conclusion: input.conclusion ?? '',
  };
};

/**
 * Build a draft from plain text input (no audio). Skip Whisper, run GPT only.
 */
export const buildDraftFromText = async (text: string): Promise<DraftResult> => {
  if (isMockMode()) {
    return { ...MOCK_DRAFT, transcript: text || MOCK_DRAFT.transcript };
  }

  if (!text.trim()) {
    return {
      transcript: '',
      evolution: emptyEvolution(),
      transcriptSource: 'text',
      structured: false,
    };
  }

  try {
    const evolution = await structureWithOpenAI(text);
    return {
      transcript: text,
      evolution,
      transcriptSource: 'text',
      structured: true,
    };
  } catch (error) {
    logger.error(`Evolution structuring failed: ${describeError(error)}`);
    return {
      transcript: text,
      evolution: emptyEvolution(),
      transcriptSource: 'text',
      structured: false,
    };
  }
};
