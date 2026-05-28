import { auth } from '@clerk/nextjs/server';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { MobileBottomNav } from '@/components/dashboard/MobileBottomNav';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { getUserProfile } from '@/libs/UserProfile';

type DashboardLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(props: DashboardLayoutProps): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: 'DashboardLayout' });
  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

export default async function DashboardLayout(props: DashboardLayoutProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);

  // Gate: send users who haven't finished onboarding to the wizard.
  // Reads from our DB (via auth() userId) — resilient to Clerk API outages.
  const { userId } = await auth();
  const profile = userId ? await getUserProfile(userId) : null;
  if (profile && !profile.onboarded) {
    redirect('/onboarding');
  }

  const plan = profile?.plan ?? 'free';

  return (
    <div className="min-h-dvh bg-ink-50/40">
      <Sidebar plan={plan} />
      <div className="pb-20 lg:pb-0 lg:pl-60">{props.children}</div>
      <MobileBottomNav plan={plan} />
    </div>
  );
}
