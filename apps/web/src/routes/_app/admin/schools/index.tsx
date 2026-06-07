import { hasRole, SUPER_ADMIN_ROLE } from '@jx3/auth/roles';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { SchoolManagementComponent } from './-components/SchoolManagementComponent';

export const Route = createFileRoute('/_app/admin/schools/')({
  beforeLoad: ({ context }) => {
    if (!hasRole(context.session.user.role, SUPER_ADMIN_ROLE)) {
      throw redirect({ to: '/' });
    }
  },
  component: SchoolManagementPage,
});

function SchoolManagementPage() {
  return <SchoolManagementComponent />;
}
