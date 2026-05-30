import { createFileRoute, redirect } from '@tanstack/react-router';
import { getCachedSession } from '#/lib/session-query';
import { AppLayoutComponent } from './-components/AppLayoutComponent';

export const Route = createFileRoute('/_app')({
  beforeLoad: async ({ location }) => {
    const session = await getCachedSession();

    if (!session) {
      throw redirect({
        to: '/login',
        search: { redirect: location.pathname + location.search },
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
