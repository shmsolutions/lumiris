import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { TopBar } from '@/components/dashboard/TopBar';
import { PatientForm } from '@/components/patients/PatientForm';
import { Link } from '@/libs/I18nNavigation';

type NewPatientPageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata(props: NewPatientPageProps): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: 'NewPatientPage' });
  return { title: t('meta_title') };
}

export default async function NewPatientPage(props: NewPatientPageProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'NewPatientPage' });
  const tList = await getTranslations({ locale, namespace: 'PatientsPage' });

  return (
    <>
      <TopBar
        breadcrumb={
          <Link href="/dashboard/patients/" className="transition hover:text-ink-900">
            {tList('title')}
          </Link>
        }
        title={t('title')}
      />
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <PageHeader eyebrow={tList('title')} title={t('title')} description={t('description')} />
        <div className="mt-8">
          <PatientForm />
        </div>
      </div>
    </>
  );
}
