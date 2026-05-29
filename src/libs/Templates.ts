import { and, desc, eq, isNull } from 'drizzle-orm';
import { db } from '@/libs/DB';
import { getDefaultTemplates } from '@/libs/UserProfile';
import { getDefaultTemplate } from '@/models/defaultTemplates';
import { templateSchema } from '@/models/Schema';
import { TemplateDefinitionValidation } from '@/validations/TemplateValidation';
import type { DocType, TemplateDefinition } from '@/validations/TemplateValidation';

export type TemplateRecord = typeof templateSchema.$inferSelect;

export type ResolvedTemplate = { templateId: string | null; definition: TemplateDefinition };

/**
 * Resolve qual modelo usar para um documento: override explícito → padrão do
 * perfil → modelo padrão em código. Devolve o `templateId` (null = padrão).
 */
export const resolveTemplate = async (
  userId: string,
  docType: DocType,
  overrideId?: string | null,
): Promise<ResolvedTemplate> => {
  const defaults = await getDefaultTemplates(userId);
  const id = overrideId ?? defaults[docType];
  if (id) {
    const template = await getTemplate(userId, id);
    if (template) {
      return {
        templateId: template.id,
        definition: TemplateDefinitionValidation.parse(template.definition),
      };
    }
  }
  return { templateId: null, definition: getDefaultTemplate(docType) };
};

/** Lista os modelos ativos do usuário, opcionalmente filtrando por tipo. */
export const listTemplates = async (
  ownerId: string,
  docType?: DocType,
): Promise<TemplateRecord[]> => {
  const conditions = [eq(templateSchema.ownerId, ownerId), isNull(templateSchema.archivedAt)];
  if (docType) {
    conditions.push(eq(templateSchema.docType, docType));
  }
  return await db
    .select()
    .from(templateSchema)
    .where(and(...conditions))
    .orderBy(desc(templateSchema.updatedAt));
};

export const getTemplate = async (ownerId: string, id: string): Promise<TemplateRecord | null> => {
  const [row] = await db
    .select()
    .from(templateSchema)
    .where(and(eq(templateSchema.id, id), eq(templateSchema.ownerId, ownerId)))
    .limit(1);
  return row ?? null;
};

export const createTemplate = async (input: {
  ownerId: string;
  docType: DocType;
  name: string;
  description?: string;
  definition: TemplateDefinition;
}) => {
  const [row] = await db
    .insert(templateSchema)
    .values({
      ownerId: input.ownerId,
      docType: input.docType,
      name: input.name,
      description: input.description ?? null,
      definition: input.definition,
    })
    .returning({ id: templateSchema.id });
  return row;
};

export const updateTemplate = async (input: {
  ownerId: string;
  id: string;
  name: string;
  description?: string;
  definition: TemplateDefinition;
}) => {
  const [row] = await db
    .update(templateSchema)
    .set({
      name: input.name,
      description: input.description ?? null,
      definition: input.definition,
    })
    .where(and(eq(templateSchema.id, input.id), eq(templateSchema.ownerId, input.ownerId)))
    .returning({ id: templateSchema.id });
  return row ?? null;
};

/** Soft-delete: arquiva o modelo (não some de documentos que já o referenciam). */
export const archiveTemplate = async (ownerId: string, id: string) => {
  await db
    .update(templateSchema)
    .set({ archivedAt: new Date() })
    .where(and(eq(templateSchema.id, id), eq(templateSchema.ownerId, ownerId)));
};
