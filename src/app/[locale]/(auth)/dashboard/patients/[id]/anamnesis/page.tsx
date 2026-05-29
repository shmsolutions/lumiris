import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { FileIcon } from '@/components/dashboard/Icons';
import { AnamnesisEditor } from '@/components/patients/AnamnesisEditor';
import { db } from '@/libs/DB';
import { listTemplates } from '@/libs/Templates';
import type { TemplateValues } from '@/libs/TemplateSchema';
import { anamnesisSchema, patientSchema } from '@/models/Schema';
import { AnamnesisDataValidation } from '@/validations/AnamnesisValidation';
import { TemplateDefinitionValidation } from '@/validations/TemplateValidation';

type AnamnesisPageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function AnamnesisPage(props: AnamnesisPageProps) {
  const { locale, id } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'AnamnesisPage' });

  const { userId } = await auth();
  if (!userId) {
    notFound();
  }

  const [patient] = await db
    .select({ id: patientSchema.id })
    .from(patientSchema)
    .where(and(eq(patientSchema.id, id), eq(patientSchema.ownerId, userId)))
    .limit(1);

  if (!patient) {
    notFound();
  }

  const [existing] = await db
    .select()
    .from(anamnesisSchema)
    .where(eq(anamnesisSchema.patientId, id))
    .limit(1);

  const parsed = AnamnesisDataValidation.safeParse(existing?.data ?? {});
  const initialData = parsed.success ? parsed.data : AnamnesisDataValidation.parse({});

  const templateRows = await listTemplates(userId, 'avaliacao');
  const templates = templateRows.map((tpl) => ({
    id: tpl.id,
    name: tpl.name,
    definition: TemplateDefinitionValidation.parse(tpl.definition),
  }));

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <a
          href={`/api/patients/${patient.id}/anamnesis/pdf?locale=${locale}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-md border border-ink-200 bg-surface-elevated px-3 py-2 text-xs font-semibold text-ink-700 transition hover:border-ink-300"
        >
          <FileIcon size={14} />
          {t('export_pdf')}
        </a>
        <a
          href={`/api/patients/${patient.id}/anamnesis/pdf?locale=${locale}&format=docx`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-md border border-ink-200 bg-surface-elevated px-3 py-2 text-xs font-semibold text-ink-700 transition hover:border-ink-300"
        >
          <FileIcon size={14} />
          {t('export_docx')}
        </a>
      </div>

      <AnamnesisEditor
        patientId={patient.id}
        initialData={initialData}
        templates={templates}
        initialTemplateId={existing?.templateId ?? ''}
        initialValues={(existing?.values ?? {}) as TemplateValues}
      />
    </div>
  );
}
