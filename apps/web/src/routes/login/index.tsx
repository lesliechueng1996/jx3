import { createFileRoute, redirect } from '@tanstack/react-router';
import { safeRedirectPath } from '#/lib/auth/auth-guard';
import { getCachedSession } from '#/lib/auth/session-query';
import { LoginComponent } from './-components/LoginComponent';

export const Route = createFileRoute('/login/')({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
  }),
  beforeLoad: async ({ search }) => {
    const session = await getCachedSession();

    if (session) {
      throw redirect({ to: safeRedirectPath(search.redirect) });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  const { redirect: redirectTo } = Route.useSearch();

  return <LoginComponent redirectTo={redirectTo} />;
}
