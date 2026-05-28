import { SidebarNav } from '@/components/dashboard/SidebarNav';
import type { PlanId } from '@/utils/Plans';

/**
 * Desktop fixed sidebar (lg+). Mobile uses MobileDrawer. O plano é resolvido
 * uma vez no layout do dashboard e propagado pra cá pra evitar consulta dupla.
 */
export const Sidebar = (props: { plan: PlanId }) => (
  <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:w-60 lg:flex-col lg:border-r lg:border-ink-200 lg:bg-surface">
    <SidebarNav plan={props.plan} />
  </aside>
);
