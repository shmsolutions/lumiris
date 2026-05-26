import { auth } from '@clerk/nextjs/server';
import { and, desc, eq } from 'drizzle-orm';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { AttachmentsManager } from '@/components/attachments/AttachmentsManager';
import { db } from '@/libs/DB';
import { attachmentSchema, patientSchema } from '@/models/Schema';

type AttachmentsPageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function AttachmentsPage(props: AttachmentsPageProps) {
  const { locale, id } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'AttachmentsPage' });

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

  const attachments = await db
    .select({
      id: attachmentSchema.id,
      fileName: attachmentSchema.fileName,
      mimeType: attachmentSchema.mimeType,
      sizeBytes: attachmentSchema.sizeBytes,
      category: attachmentSchema.category,
    })
    .from(attachmentSchema)
    .where(eq(attachmentSchema.patientId, id))
    .orderBy(desc(attachmentSchema.createdAt));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-ink-900">{t('title')}</h2>
        <p className="text-sm text-ink-500">{t('description')}</p>
      </div>

      <AttachmentsManager patientId={id} initialAttachments={attachments} />
    </div>
  );
}
