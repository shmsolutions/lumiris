import { TemplateDefinitionValidation } from '@/validations/TemplateValidation';
import type { DocType, TemplateDefinition } from '@/validations/TemplateValidation';

/**
 * Modelos padrão (formato CREFITO) embutidos em código — todo usuário os tem.
 * As `key` dos campos batem com as colunas/JSON atuais (procedimento, evolucao,
 * initialComplaint, objectiveProgress…), então o compilador de schema da IA
 * reproduz exatamente o formato fixo de hoje e a renderização lê os dados legados
 * sem migração. Mais seções (cabeçalho, avaliação) entram nas fases seguintes.
 */
export const DEFAULT_EVOLUCAO_TEMPLATE = TemplateDefinitionValidation.parse({
  sections: [
    {
      key: 'evolucao',
      type: 'narrative',
      title: 'Evolução',
      fields: [
        { key: 'procedimento', label: 'Procedimento(s)' },
        { key: 'intercorrencia', label: 'Intercorrência' },
        { key: 'evolucao', label: 'Evolução do estado de saúde' },
      ],
    },
  ],
});

export const DEFAULT_RELATORIO_TEMPLATE = TemplateDefinitionValidation.parse({
  sections: [
    {
      key: 'queixaInicial',
      type: 'narrative',
      title: 'Queixa inicial',
      fields: [{ key: 'initialComplaint', label: 'Queixa inicial' }],
    },
    {
      key: 'evolucaoGeral',
      type: 'narrative',
      title: 'Evolução geral',
      fields: [{ key: 'generalEvolution', label: 'Evolução geral' }],
    },
    {
      key: 'objectiveProgress',
      type: 'objectives_table',
      title: 'Evolução por objetivo',
      fields: [
        { key: 'title', label: 'Objetivo' },
        { key: 'progress', label: 'Progresso' },
      ],
    },
    {
      key: 'dificuldades',
      type: 'narrative',
      title: 'Dificuldades',
      fields: [{ key: 'difficulties', label: 'Dificuldades' }],
    },
    {
      key: 'sugestoes',
      type: 'narrative',
      title: 'Sugestões',
      fields: [{ key: 'suggestions', label: 'Sugestões' }],
    },
    {
      key: 'conclusao',
      type: 'narrative',
      title: 'Conclusão',
      fields: [{ key: 'conclusion', label: 'Conclusão' }],
    },
  ],
});

const EMPTY_TEMPLATE: TemplateDefinition = { version: 1, sections: [] };

/** Modelo padrão (em código) por tipo de documento. */
export const getDefaultTemplate = (docType: DocType): TemplateDefinition => {
  if (docType === 'evolucao') {
    return DEFAULT_EVOLUCAO_TEMPLATE;
  }
  if (docType === 'relatorio') {
    return DEFAULT_RELATORIO_TEMPLATE;
  }
  // Avaliação ainda usa o formato fixo (wiring de modelo custom virá depois).
  return EMPTY_TEMPLATE;
};
