import {
  APP_ROLE_LABELS,
  APP_ROLES,
  type AppRole,
  AUTH_PROVIDER_LABELS,
  AUTH_PROVIDERS,
  type AuthProvider,
} from '@jx3/auth/roles';
import { type KeyboardEvent, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { UsersSearch } from './users-search-schema';

type UserFiltersComponentProps = {
  committedFilters: UsersSearch;
  onSearch: (filters: UsersSearch) => void;
  onReset: () => void;
};

const ALL_VALUE = '__all__';

export function UserFiltersComponent({
  committedFilters,
  onSearch,
  onReset,
}: UserFiltersComponentProps) {
  const [draft, setDraft] = useState(committedFilters);

  useEffect(() => {
    setDraft(committedFilters);
  }, [committedFilters]);

  const handleSearch = () => {
    onSearch({ ...draft, page: 1 });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSearch();
    }
  };

  return (
    <div className="space-y-4 rounded-lg border border-border p-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="space-y-2">
          <Label htmlFor="filter-name">用户名</Label>
          <Input
            id="filter-name"
            value={draft.name ?? ''}
            placeholder="搜索用户名"
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                name: event.target.value || undefined,
              }))
            }
            onKeyDown={handleKeyDown}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="filter-email">邮箱</Label>
          <Input
            id="filter-email"
            value={draft.email ?? ''}
            placeholder="搜索邮箱"
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                email: event.target.value || undefined,
              }))
            }
            onKeyDown={handleKeyDown}
          />
        </div>
        <div className="space-y-2">
          <Label>角色</Label>
          <Select
            value={draft.role ?? ALL_VALUE}
            onValueChange={(value) =>
              setDraft((current) => ({
                ...current,
                role: value === ALL_VALUE ? undefined : (value as AppRole),
              }))
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
              draft.banned === undefined
                ? ALL_VALUE
                : draft.banned
                  ? 'true'
                  : 'false'
            }
            onValueChange={(value) =>
              setDraft((current) => ({
                ...current,
                banned: value === ALL_VALUE ? undefined : value === 'true',
              }))
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
            value={draft.provider ?? ALL_VALUE}
            onValueChange={(value) =>
              setDraft((current) => ({
                ...current,
                provider:
                  value === ALL_VALUE ? undefined : (value as AuthProvider),
              }))
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
      <div className="flex items-center gap-2">
        <Button type="button" onClick={handleSearch}>
          搜索
        </Button>
        <Button type="button" variant="outline" onClick={onReset}>
          重置
        </Button>
      </div>
    </div>
  );
}
