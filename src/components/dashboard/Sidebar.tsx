import { SidebarNav } from '@/components/dashboard/SidebarNav';

/**
 * Desktop fixed sidebar (lg+). Mobile uses MobileDrawer.
 */
export const Sidebar = () => (
  <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:w-60 lg:flex-col lg:border-r lg:border-ink-200 lg:bg-surface">
    <SidebarNav />
  </aside>
);
