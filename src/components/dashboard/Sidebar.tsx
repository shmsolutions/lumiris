import { auth } from '@clerk/nextjs/server';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { getUserProfile } from '@/libs/UserProfile';

/**
 * Desktop fixed sidebar (lg+). Mobile uses MobileDrawer. Reads the user's
 * plan server-side so the bottom block can show it (or pitch an upgrade).
 */
export const Sidebar = async () => {
  const { userId } = await auth();
  const profile = userId ? await getUserProfile(userId) : null;

  return (
    <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:w-60 lg:flex-col lg:border-r lg:border-ink-200 lg:bg-surface">
      <SidebarNav plan={profile?.plan ?? 'free'} />
    </aside>
  );
};
