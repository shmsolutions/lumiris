import type { TemplateDefinition } from '@/validations/TemplateValidation';

/** Valor de um campo capturado: texto (narrativo) ou linhas (tabela de objetivos). */
export type TemplateValue = string | { title: string; progress: string }[];
export type TemplateValues = Record<string, TemplateValue>;

type StringProperty = { type: 'string' };

type ArrayProperty = {
  type: 'array';
  items: {
    type: 'object';
    additionalProperties: false;
    properties: Record<string, StringProperty>;
    required: string[];
  };
};

export type CompiledJsonSchema = {
  type: 'object';
  additionalProperties: false;
  properties: Record<string, StringProperty | ArrayProperty>;
  required: string[];
};

/**
 * Compila a definição de um modelo no `json_schema` estrito que a OpenAI espera
 * para structured outputs. Campos `narrative` viram propriedades string; seções
 * `objectives_table` viram um array de objetos (uma propriedade pela `key` da
 * seção). Seções `header` são auto-preenchidas e não entram no schema da IA.
 * Modo estrito: `additionalProperties:false` e todas as props em `required`.
 */
export const compileJsonSchema = (definition: TemplateDefinition): CompiledJsonSchema => {
  const properties: Record<string, StringProperty | ArrayProperty> = {};
  const required: string[] = [];

  for (const section of definition.sections) {
    if (section.type === 'narrative') {
      for (const field of section.fields) {
        properties[field.key] = { type: 'string' };
        required.push(field.key);
      }
    } else if (section.type === 'objectives_table') {
      const columnProperties: Record<string, StringProperty> = {};
      const columnRequired: string[] = [];
      for (const field of section.fields) {
        columnProperties[field.key] = { type: 'string' };
        columnRequired.push(field.key);
      }
      properties[section.key] = {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: columnProperties,
          required: columnRequired,
        },
      };
      required.push(section.key);
    }
  }

  return { type: 'object', additionalProperties: false, properties, required };
};

/**
 * Monta o system prompt da IA a partir do modelo: a prosa-base (guardrails
 * clínicos) + uma instrução por campo (label + guia). Só campos narrativos e a
 * tabela de objetivos entram (cabeçalho é auto-preenchido).
 */
export const compileSystemPrompt = (definition: TemplateDefinition, basePrompt: string): string => {
  const lines: string[] = [];
  for (const section of definition.sections) {
    if (section.type === 'narrative') {
      for (const field of section.fields) {
        lines.push(`- ${field.label}${field.guide ? `: ${field.guide}` : ''}`);
      }
    } else if (section.type === 'objectives_table') {
      lines.push(`- ${section.title}: uma entrada por objetivo, com título e progresso.`);
    }
  }
  return `${basePrompt}\n\nPreencha os seguintes campos:\n${lines.join('\n')}`;
};

/** Converte a saída crua da IA num mapa de valores keyed pelas keys do modelo. */
export const mapOutputToValues = (
  definition: TemplateDefinition,
  parsed: Record<string, unknown>,
): TemplateValues => {
  const values: TemplateValues = {};
  for (const section of definition.sections) {
    if (section.type === 'narrative') {
      for (const field of section.fields) {
        const raw = parsed[field.key];
        values[field.key] = typeof raw === 'string' ? raw : '';
      }
    } else if (section.type === 'objectives_table') {
      const raw = parsed[section.key];
      values[section.key] = Array.isArray(raw)
        ? (raw as { title: string; progress: string }[])
        : [];
    }
  }
  return values;
};
