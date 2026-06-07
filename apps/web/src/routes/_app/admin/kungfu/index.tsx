import { hasRole, SUPER_ADMIN_ROLE } from '@jx3/auth/roles';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { zodValidator } from '@tanstack/zod-adapter';
import { KungfuManagementComponent } from './-components/KungfuManagementComponent';
import { kungfuSearchSchema } from './-components/kungfu-search-schema';

export const Route = createFileRoute('/_app/admin/kungfu/')({
  validateSearch: zodValidator(kungfuSearchSchema),
  beforeLoad: ({ context }) => {
    if (!hasRole(context.session.user.role, SUPER_ADMIN_ROLE)) {
      throw redirect({ to: '/' });
    }
  },
  component: KungfuManagementPage,
});

function KungfuManagementPage() {
  return <KungfuManagementComponent />;
}
