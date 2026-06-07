import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { AdminUserListItem } from '#/lib/api/admin/users-admin-api';
import {
  type ListUsersFilters,
  usersAdminApi,
  usersAdminQueryKey,
} from '#/lib/api/admin/users-admin-api';
import { ApiRequestError } from '#/lib/api/request';
import { Button } from '@/components/ui/button';
import { BanUserDialogComponent } from './BanUserDialogComponent';
import { EditUserDialogComponent } from './EditUserDialogComponent';
import { UserFiltersComponent } from './UserFiltersComponent';
import { UserTableComponent } from './UserTableComponent';

const DEFAULT_FILTERS: ListUsersFilters = {
  page: 1,
  pageSize: 20,
};

type UserManagementComponentProps = {
  currentUserId: string;
};

export function UserManagementComponent({
  currentUserId,
}: UserManagementComponentProps) {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<ListUsersFilters>(DEFAULT_FILTERS);
  const [editingUser, setEditingUser] = useState<AdminUserListItem | null>(
    null,
  );
  const [banningUser, setBanningUser] = useState<AdminUserListItem | null>(
    null,
  );
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);

  const usersQuery = useQuery({
    queryKey: [...usersAdminQueryKey, filters],
    queryFn: () => usersAdminApi.list(filters),
  });

  const invalidateUsers = async () => {
    await queryClient.invalidateQueries({ queryKey: usersAdminQueryKey });
  };

  const handleError = (error: unknown, fallbackMessage: string) => {
    if (error instanceof ApiRequestError) {
      toast.error(error.message);
      return;
    }
    toast.error(fallbackMessage);
  };

  const updateMutation = useMutation({
    mutationFn: ({
      userId,
      name,
      role,
    }: {
      userId: string;
      name: string;
      role: string;
    }) => usersAdminApi.update(userId, { name, role }),
    onSuccess: async () => {
      toast.success('用户信息已更新');
      setEditingUser(null);
      await invalidateUsers();
    },
    onError: (error) => handleError(error, '更新用户失败'),
  });

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => usersAdminApi.delete(userId),
    onSuccess: async () => {
      toast.success('用户已删除');
      await invalidateUsers();
    },
    onError: (error) => handleError(error, '删除用户失败'),
    onSettled: () => setPendingUserId(null),
  });

  const banMutation = useMutation({
    mutationFn: (
      input:
        | { userId: string; banned: false }
        | { userId: string; banned: true; banReason: string },
    ) =>
      input.banned
        ? usersAdminApi.ban(input.userId, input.banReason)
        : usersAdminApi.unban(input.userId),
    onSuccess: async () => {
      toast.success('封禁状态已更新');
      setBanningUser(null);
      await invalidateUsers();
    },
    onError: (error) => handleError(error, '更新封禁状态失败'),
    onSettled: () => setPendingUserId(null),
  });

  const revokeMutation = useMutation({
    mutationFn: (userId: string) => usersAdminApi.revokeSessions(userId),
    onSuccess: async () => {
      toast.success('已撤销该用户的所有会话');
      await invalidateUsers();
    },
    onError: (error) => handleError(error, '撤销会话失败'),
    onSettled: () => setPendingUserId(null),
  });

  const totalPages = useMemo(() => {
    const total = usersQuery.data?.total ?? 0;
    return Math.max(1, Math.ceil(total / filters.pageSize));
  }, [filters.pageSize, usersQuery.data?.total]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">用户管理</h1>
        <p className="text-sm text-muted-foreground">
          查看、编辑和管理平台用户，仅超级管理员可访问。
        </p>
      </div>

      <UserFiltersComponent filters={filters} onChange={setFilters} />

      {usersQuery.isError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          加载用户列表失败，请稍后重试。
        </div>
      ) : null}

      <UserTableComponent
        items={usersQuery.data?.items ?? []}
        currentUserId={currentUserId}
        pendingUserId={pendingUserId}
        onBanToggle={(user, banned) => {
          if (user.id === currentUserId) {
            toast.error('不能封禁当前登录用户');
            return;
          }
          if (banned) {
            setBanningUser(user);
            return;
          }
          setPendingUserId(user.id);
          banMutation.mutate({ userId: user.id, banned: false });
        }}
        onEdit={setEditingUser}
        onDelete={(user) => {
          if (!window.confirm(`确定删除用户 ${user.name} 吗？`)) {
            return;
          }
          setPendingUserId(user.id);
          deleteMutation.mutate(user.id);
        }}
        onRevokeSessions={(user) => {
          setPendingUserId(user.id);
          revokeMutation.mutate(user.id);
        }}
      />

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          共 {usersQuery.data?.total ?? 0} 条，第 {filters.page} / {totalPages}{' '}
          页
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={filters.page <= 1 || usersQuery.isFetching}
            onClick={() =>
              setFilters((current) => ({ ...current, page: current.page - 1 }))
            }
          >
            上一页
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={filters.page >= totalPages || usersQuery.isFetching}
            onClick={() =>
              setFilters((current) => ({ ...current, page: current.page + 1 }))
            }
          >
            下一页
          </Button>
        </div>
      </div>

      <EditUserDialogComponent
        user={editingUser}
        open={editingUser !== null}
        pending={updateMutation.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setEditingUser(null);
          }
        }}
        onSubmit={(values) => {
          if (!editingUser) {
            return;
          }
          updateMutation.mutate({
            userId: editingUser.id,
            name: values.name,
            role: values.role,
          });
        }}
      />

      <BanUserDialogComponent
        user={banningUser}
        open={banningUser !== null}
        pending={banMutation.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setBanningUser(null);
          }
        }}
        onSubmit={(banReason) => {
          if (!banningUser) {
            return;
          }
          setPendingUserId(banningUser.id);
          banMutation.mutate({
            userId: banningUser.id,
            banned: true,
            banReason,
          });
        }}
      />
    </div>
  );
}
