import { hasRole, SUPER_ADMIN_ROLE } from '@jx3/auth/roles';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { ServerManagementComponent } from './-components/ServerManagementComponent';

export const Route = createFileRoute('/_app/admin/servers/')({
  beforeLoad: ({ context }) => {
    if (!hasRole(context.session.user.role, SUPER_ADMIN_ROLE)) {
      throw redirect({ to: '/' });
    }
  },
  component: ServerManagementPage,
});

function ServerManagementPage() {
  return <ServerManagementComponent />;
}
