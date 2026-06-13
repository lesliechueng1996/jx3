import { hasRole, SUPER_ADMIN_ROLE } from '@jx3/auth/roles';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { zodValidator } from '@tanstack/zod-adapter';
import { DungeonManagementComponent } from './-components/DungeonManagementComponent';
import { dungeonSearchSchema } from './-components/dungeon-search-schema';

export const Route = createFileRoute('/_app/admin/dungeons/')({
  validateSearch: zodValidator(dungeonSearchSchema),
  beforeLoad: ({ context }) => {
    if (!hasRole(context.session.user.role, SUPER_ADMIN_ROLE)) {
      throw redirect({ to: '/' });
    }
  },
  component: DungeonManagementPage,
});

function DungeonManagementPage() {
  return <DungeonManagementComponent />;
}
