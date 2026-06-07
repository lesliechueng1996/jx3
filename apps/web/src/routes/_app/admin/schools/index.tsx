import { hasRole, SUPER_ADMIN_ROLE } from '@jx3/auth/roles';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { zodValidator } from '@tanstack/zod-adapter';
import { SchoolManagementComponent } from './-components/SchoolManagementComponent';
import { schoolsSearchSchema } from './-components/schools-search-schema';

export const Route = createFileRoute('/_app/admin/schools/')({
  validateSearch: zodValidator(schoolsSearchSchema),
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
