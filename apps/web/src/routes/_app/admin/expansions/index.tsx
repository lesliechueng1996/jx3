import { hasRole, SUPER_ADMIN_ROLE } from '@jx3/auth/roles';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { ExpansionManagementComponent } from './-components/ExpansionManagementComponent';

export const Route = createFileRoute('/_app/admin/expansions/')({
  beforeLoad: ({ context }) => {
    if (!hasRole(context.session.user.role, SUPER_ADMIN_ROLE)) {
      throw redirect({ to: '/' });
    }
  },
  component: ExpansionManagementPage,
});

function ExpansionManagementPage() {
  return <ExpansionManagementComponent />;
}
