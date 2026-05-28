import { auth } from '@clerk/nextjs/server';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { TopBar } from '@/components/dashboard/TopBar';
import { TherapistProfileForm } from '@/components/settings/TherapistProfileForm';
import { Link } from '@/libs/I18nNavigation';
import { getUserProfile } from '@/libs/UserProfile';

type ProfilePageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata(props: ProfilePageProps): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: 'TherapistProfilePage' });
  return { title: t('meta_title') };
}

export default async function TherapistProfilePage(props: ProfilePageProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'TherapistProfilePage' });
  const tSettings = await getTranslations({ locale, namespace: 'SettingsPage' });

  const { userId } = await auth();
  const profile = userId
    ? await getUserProfile(userId)
    : { therapistName: '', crefito: '', studentName: '' };

  return (
    <>
      <TopBar
        breadcrumb={
          <Link href="/dashboard/settings/" className="transition hover:text-ink-900">
            {tSettings('title')}
          </Link>
        }
        title={t('title')}
      />
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <PageHeader
          eyebrow={tSettings('title')}
          title={t('title')}
          description={t('description')}
        />
        <div className="mt-8">
          <TherapistProfileForm
            initialValues={{
              therapistName: profile.therapistName ?? '',
              crefito: profile.crefito ?? '',
              studentName: profile.studentName ?? '',
            }}
          />
        </div>
      </div>
    </>
  );
}
