import { hasRole, SUPER_ADMIN_ROLE } from '@jx3/auth/roles';
import { Link } from '@tanstack/react-router';
import {
  BookOpen,
  ClipboardList,
  Landmark,
  Shield,
  Swords,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const BASE_NAV_ITEMS = [
  {
    to: '/characters' as const,
    label: '我的角色',
    icon: Users,
  },
  {
    to: '/raids/create' as const,
    label: '我要开团',
    icon: Swords,
  },
  {
    to: '/raids/history' as const,
    label: '参团记录',
    icon: ClipboardList,
  },
] as const;

const ADMIN_NAV_ITEMS = [
  {
    to: '/admin/users' as const,
    label: '用户管理',
    icon: Shield,
  },
  {
    to: '/admin/schools' as const,
    label: '门派管理',
    icon: Landmark,
  },
  {
    to: '/admin/kungfu' as const,
    label: '心法管理',
    icon: BookOpen,
  },
] as const;

type AppSidebarComponentProps = {
  userRole?: string | null;
};

export function AppSidebarComponent({ userRole }: AppSidebarComponentProps) {
  const navItems = hasRole(userRole, SUPER_ADMIN_ROLE)
    ? [...BASE_NAV_ITEMS, ...ADMIN_NAV_ITEMS]
    : BASE_NAV_ITEMS;

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-sidebar text-sidebar-foreground">
      <nav className="flex flex-col gap-1 p-3">
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              '[&.active]:bg-sidebar-accent [&.active]:text-sidebar-accent-foreground',
            )}
            activeProps={{ className: 'active' }}
          >
            <item.icon className="size-4 shrink-0" />
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
