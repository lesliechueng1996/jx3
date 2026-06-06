import {
  APP_ROLE_LABELS,
  APP_ROLES,
  type AppRole,
  AUTH_PROVIDER_LABELS,
  AUTH_PROVIDERS,
  type AuthProvider,
} from '@jx3/auth/roles';
import type { ListUsersFilters } from '#/lib/users-admin-api';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type UserFiltersComponentProps = {
  filters: ListUsersFilters;
  onChange: (filters: ListUsersFilters) => void;
};

const ALL_VALUE = '__all__';

export function UserFiltersComponent({
  filters,
  onChange,
}: UserFiltersComponentProps) {
  return (
    <div className="grid gap-4 rounded-lg border border-border p-4 md:grid-cols-2 xl:grid-cols-5">
      <div className="space-y-2">
        <Label htmlFor="filter-name">用户名</Label>
        <Input
          id="filter-name"
          value={filters.name ?? ''}
          placeholder="搜索用户名"
          onChange={(event) =>
            onChange({
              ...filters,
              page: 1,
              name: event.target.value || undefined,
            })
          }
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="filter-email">邮箱</Label>
        <Input
          id="filter-email"
          value={filters.email ?? ''}
          placeholder="搜索邮箱"
          onChange={(event) =>
            onChange({
              ...filters,
              page: 1,
              email: event.target.value || undefined,
            })
          }
        />
      </div>
      <div className="space-y-2">
        <Label>角色</Label>
        <Select
          value={filters.role ?? ALL_VALUE}
          onValueChange={(value) =>
            onChange({
              ...filters,
              page: 1,
              role: value === ALL_VALUE ? undefined : (value as AppRole),
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="全部角色" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>全部角色</SelectItem>
            {APP_ROLES.map((role) => (
              <SelectItem key={role} value={role}>
                {APP_ROLE_LABELS[role]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>封禁状态</Label>
        <Select
          value={
            filters.banned === undefined
              ? ALL_VALUE
              : filters.banned
                ? 'true'
                : 'false'
          }
          onValueChange={(value) =>
            onChange({
              ...filters,
              page: 1,
              banned: value === ALL_VALUE ? undefined : value === 'true',
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="全部状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>全部状态</SelectItem>
            <SelectItem value="true">已封禁</SelectItem>
            <SelectItem value="false">未封禁</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>登录方式</Label>
        <Select
          value={filters.provider ?? ALL_VALUE}
          onValueChange={(value) =>
            onChange({
              ...filters,
              page: 1,
              provider:
                value === ALL_VALUE ? undefined : (value as AuthProvider),
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="全部方式" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>全部方式</SelectItem>
            {AUTH_PROVIDERS.map((provider) => (
              <SelectItem key={provider} value={provider}>
                {AUTH_PROVIDER_LABELS[provider]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
