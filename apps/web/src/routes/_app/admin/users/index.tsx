import { hasRole, SUPER_ADMIN_ROLE } from '@jx3/auth/roles';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { UserManagementComponent } from './-components/UserManagementComponent';

export const Route = createFileRoute('/_app/admin/users/')({
  beforeLoad: ({ context }) => {
    if (!hasRole(context.session.user.role, SUPER_ADMIN_ROLE)) {
      throw redirect({ to: '/' });
    }
  },
  component: UserManagementPage,
});

function UserManagementPage() {
  const { session } = Route.useRouteContext();
  return <UserManagementComponent currentUserId={session.user.id} />;
}
