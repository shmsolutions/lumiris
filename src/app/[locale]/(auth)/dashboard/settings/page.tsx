import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ComingSoon } from '@/components/dashboard/ComingSoon';
import { SettingsIcon } from '@/components/dashboard/Icons';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { TopBar } from '@/components/dashboard/TopBar';
import { Link } from '@/libs/I18nNavigation';

type SettingsPageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata(props: SettingsPageProps): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: 'SettingsPage' });
  return { title: t('meta_title') };
}

export default async function SettingsPage(props: SettingsPageProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'SettingsPage' });
  const tNav = await getTranslations({ locale, namespace: 'DashboardNav' });

  return (
    <>
      <TopBar breadcrumb={tNav('section_account')} title={t('title')} />
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        <PageHeader title={t('title')} description={t('description')} />

        <div className="mt-8 space-y-4">
          <Link
            href="/dashboard/settings/profile/"
            className="flex items-center justify-between rounded-xl border border-ink-200 bg-surface-elevated px-5 py-4 transition hover:border-ink-300"
          >
            <div>
              <div className="text-sm font-semibold text-ink-900">{t('therapist_title')}</div>
              <div className="mt-0.5 text-xs text-ink-500">{t('therapist_description')}</div>
            </div>
            <span className="text-ink-400">→</span>
          </Link>

          <Link
            href="/dashboard/settings/billing/"
            className="flex items-center justify-between rounded-xl border border-ink-200 bg-surface-elevated px-5 py-4 transition hover:border-ink-300"
          >
            <div>
              <div className="text-sm font-semibold text-ink-900">{t('billing_title')}</div>
              <div className="mt-0.5 text-xs text-ink-500">{t('billing_description')}</div>
            </div>
            <span className="text-ink-400">→</span>
          </Link>

          <Link
            href="/dashboard/user-profile/"
            className="flex items-center justify-between rounded-xl border border-ink-200 bg-surface-elevated px-5 py-4 transition hover:border-ink-300"
          >
            <div>
              <div className="text-sm font-semibold text-ink-900">{t('profile_title')}</div>
              <div className="mt-0.5 text-xs text-ink-500">{t('profile_description')}</div>
            </div>
            <span className="text-ink-400">→</span>
          </Link>

          <div className="mt-10">
            <ComingSoon
              icon={<SettingsIcon size={28} />}
              title={t('coming_title')}
              description={t('coming_description')}
              bullets={[t('bullet_a'), t('bullet_b'), t('bullet_c')]}
              eta={t('eta')}
            />
          </div>
        </div>
      </div>
    </>
  );
}
