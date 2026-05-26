import { auth } from '@clerk/nextjs/server';
import { and, asc, eq, isNull } from 'drizzle-orm';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { TopBar } from '@/components/dashboard/TopBar';
import { AppointmentForm } from '@/components/schedule/AppointmentForm';
import { db } from '@/libs/DB';
import { Link } from '@/libs/I18nNavigation';
import { patientSchema } from '@/models/Schema';

type NewAppointmentPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ patient?: string }>;
};

export async function generateMetadata(props: NewAppointmentPageProps): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: 'NewAppointmentPage' });
  return { title: t('meta_title') };
}

export default async function NewAppointmentPage(props: NewAppointmentPageProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'NewAppointmentPage' });
  const tList = await getTranslations({ locale, namespace: 'SchedulePage' });
  const searchParams = await props.searchParams;

  const { userId } = await auth();

  const patients = userId
    ? await db
        .select({ id: patientSchema.id, fullName: patientSchema.fullName })
        .from(patientSchema)
        .where(and(eq(patientSchema.ownerId, userId), isNull(patientSchema.archivedAt)))
        .orderBy(asc(patientSchema.fullName))
    : [];

  return (
    <>
      <TopBar
        breadcrumb={
          <Link href="/dashboard/schedule/" className="transition hover:text-ink-900">
            {tList('title')}
          </Link>
        }
        title={t('title')}
      />
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <PageHeader eyebrow={tList('title')} title={t('title')} description={t('description')} />
        <div className="mt-8">
          <AppointmentForm
            patients={patients}
            initial={searchParams.patient ? { patientId: searchParams.patient } : undefined}
          />
        </div>
      </div>
    </>
  );
}
