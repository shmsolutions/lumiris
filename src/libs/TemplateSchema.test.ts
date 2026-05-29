import { describe, expect, it } from 'vitest';
import { compileJsonSchema } from '@/libs/TemplateSchema';
import { DEFAULT_EVOLUCAO_TEMPLATE, DEFAULT_RELATORIO_TEMPLATE } from '@/models/defaultTemplates';

describe(compileJsonSchema, () => {
  it('reproduces the evolution_note schema from the default evolução template', () => {
    expect(compileJsonSchema(DEFAULT_EVOLUCAO_TEMPLATE)).toStrictEqual({
      type: 'object',
      additionalProperties: false,
      properties: {
        procedimento: { type: 'string' },
        intercorrencia: { type: 'string' },
        evolucao: { type: 'string' },
      },
      required: ['procedimento', 'intercorrencia', 'evolucao'],
    });
  });

  it('reproduces the progress_report schema from the default relatório template', () => {
    expect(compileJsonSchema(DEFAULT_RELATORIO_TEMPLATE)).toStrictEqual({
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
            properties: { title: { type: 'string' }, progress: { type: 'string' } },
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
    });
  });
});
