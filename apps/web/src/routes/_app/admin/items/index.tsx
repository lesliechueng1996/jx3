import { hasRole, SUPER_ADMIN_ROLE } from '@jx3/auth/roles';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { zodValidator } from '@tanstack/zod-adapter';
import { ItemManagementComponent } from './-components/ItemManagementComponent';
import { itemSearchSchema } from './-components/item-search-schema';

export const Route = createFileRoute('/_app/admin/items/')({
  validateSearch: zodValidator(itemSearchSchema),
  beforeLoad: ({ context }) => {
    if (!hasRole(context.session.user.role, SUPER_ADMIN_ROLE)) {
      throw redirect({ to: '/' });
    }
  },
  component: ItemManagementPage,
});

function ItemManagementPage() {
  return <ItemManagementComponent />;
}
