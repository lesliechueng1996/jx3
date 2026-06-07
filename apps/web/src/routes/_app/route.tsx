import { createFileRoute, redirect } from '@tanstack/react-router';
import { getCachedSession } from '#/lib/auth/session-query';
import { AppLayoutComponent } from './-components/AppLayoutComponent';

export const Route = createFileRoute('/_app')({
  beforeLoad: async ({ location }) => {
    const session = await getCachedSession();

    if (!session) {
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
      });
    }

    return { session };
  },
  component: AppShell,
});

function AppShell() {
  const { session } = Route.useRouteContext();
  return <AppLayoutComponent session={session} />;
}
