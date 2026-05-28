import { UserProfile } from '@clerk/nextjs';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { TopBar } from '@/components/dashboard/TopBar';
import { Link } from '@/libs/I18nNavigation';
import { getI18nPath } from '@/utils/Helpers';

export default async function UserProfilePage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'SettingsPage' });

  return (
    <>
      <TopBar
        breadcrumb={
          <Link href="/dashboard/settings/" className="transition hover:text-ink-900">
            {t('title')}
          </Link>
        }
        title={t('account_title')}
      />
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        <PageHeader
          eyebrow={t('title')}
          title={t('account_title')}
          description={t('account_description')}
        />
        <div className="mt-8">
          <UserProfile
            path={getI18nPath('/dashboard/user-profile', locale)}
            appearance={{
              elements: {
                rootBox: 'w-full',
                cardBox: 'w-full max-w-none shadow-none border border-ink-200 rounded-xl',
              },
            }}
          />
        </div>
      </div>
    </>
  );
}
