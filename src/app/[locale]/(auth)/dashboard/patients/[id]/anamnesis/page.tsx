import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { FileIcon } from '@/components/dashboard/Icons';
import { AnamnesisForm } from '@/components/patients/AnamnesisForm';
import { db } from '@/libs/DB';
import { anamnesisSchema, patientSchema } from '@/models/Schema';
import { AnamnesisDataValidation } from '@/validations/AnamnesisValidation';

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

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <a
          href={`/api/patients/${patient.id}/anamnesis/pdf?locale=${locale}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-md border border-ink-200 bg-surface-elevated px-3 py-2 text-xs font-semibold text-ink-700 transition hover:border-ink-300"
        >
          <FileIcon size={14} />
          {t('export_pdf')}
        </a>
      </div>

      <AnamnesisForm patientId={patient.id} initialData={initialData} />
    </div>
  );
}
