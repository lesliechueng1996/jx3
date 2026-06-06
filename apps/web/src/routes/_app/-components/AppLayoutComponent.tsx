import { Outlet } from '@tanstack/react-router';
import type { Session } from '#/lib/auth-client';
import { AppSidebarComponent } from './AppSidebarComponent';
import { UserMenuComponent } from './UserMenuComponent';

type AppLayoutComponentProps = {
  session: Session;
};

export function AppLayoutComponent({ session }: AppLayoutComponentProps) {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="JX3"
            className="size-9 rounded-md object-cover"
            width={36}
            height={36}
          />
          <div className="leading-tight">
            <p className="text-sm font-semibold tracking-tight">JX3</p>
            <p className="text-xs text-muted-foreground">剑网3团本与掉落管理</p>
          </div>
        </div>
        <UserMenuComponent user={session.user} />
      </header>
      <div className="flex min-h-0 flex-1">
        <AppSidebarComponent userRole={session.user.role} />
        <main className="min-w-0 flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
