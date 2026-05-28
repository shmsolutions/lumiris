import { auth, currentUser } from '@clerk/nextjs/server';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { getUserProfile } from '@/libs/UserProfile';

type OnboardingPageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata(props: OnboardingPageProps): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: 'Onboarding' });
  return { title: t('meta_title') };
}

export default async function OnboardingPage(props: OnboardingPageProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);

  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }

  const profile = await getUserProfile(userId);
  if (profile.onboarded) {
    redirect('/dashboard');
  }

  // First name is cosmetic — falls back gracefully if Clerk is unreachable.
  const user = await currentUser().catch(() => null);
  const firstName = user?.firstName ?? user?.primaryEmailAddress?.emailAddress?.split('@')[0] ?? '';
  const clerkFullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim();

  return (
    <OnboardingWizard
      firstName={firstName}
      initial={{ therapistName: profile.therapistName || clerkFullName }}
    />
  );
}
