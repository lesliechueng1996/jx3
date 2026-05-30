import { Link } from '@tanstack/react-router';
import { ClipboardList, Swords, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
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

export function AppSidebarComponent() {
  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-sidebar text-sidebar-foreground">
      <nav className="flex flex-col gap-1 p-3">
        {NAV_ITEMS.map((item) => (
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
