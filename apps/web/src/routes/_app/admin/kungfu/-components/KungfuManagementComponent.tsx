import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getRouteApi } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { AdminKungfuListItem } from '#/lib/api/admin/kungfu-admin-api';
import {
  kungfuAdminApi,
  kungfuAdminQueryKey,
} from '#/lib/api/admin/kungfu-admin-api';
import { ApiRequestError } from '#/lib/api/request';
import { toRouteSearch } from '#/routes/_app/admin/-components/admin-list-search';
import { Button } from '@/components/ui/button';
import { KungfuFiltersComponent } from './KungfuFiltersComponent';
import { KungfuFormDialogComponent } from './KungfuFormDialogComponent';
import { KungfuTableComponent } from './KungfuTableComponent';
import {
  DEFAULT_KUNGFU_SEARCH,
  type KungfuSearch,
} from './kungfu-search-schema';

const kungfuRouteApi = getRouteApi('/_app/admin/kungfu/');

export function KungfuManagementComponent() {
  const navigate = kungfuRouteApi.useNavigate();
  const filters = kungfuRouteApi.useSearch();
  const queryClient = useQueryClient();
  const [editingKungfu, setEditingKungfu] =
    useState<AdminKungfuListItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [pendingKungfuId, setPendingKungfuId] = useState<string | null>(null);

  const updateSearch = (nextFilters: KungfuSearch) => {
    navigate({
      to: '.',
      search: toRouteSearch(nextFilters, DEFAULT_KUNGFU_SEARCH),
    });
  };

  const kungfuQuery = useQuery({
    queryKey: [...kungfuAdminQueryKey, filters],
    queryFn: () => kungfuAdminApi.list(filters),
  });

  const invalidateKungfu = async () => {
    await queryClient.invalidateQueries({ queryKey: kungfuAdminQueryKey });
  };

  const handleError = (error: unknown, fallbackMessage: string) => {
    if (error instanceof ApiRequestError) {
      toast.error(error.message);
      return;
    }
    toast.error(fallbackMessage);
  };

  const createMutation = useMutation({
    mutationFn: kungfuAdminApi.create,
    onSuccess: async () => {
      toast.success('心法已创建');
      setCreating(false);
      await invalidateKungfu();
    },
    onError: (error) => handleError(error, '创建心法失败'),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      kungfuId,
      ...body
    }: { kungfuId: string } & Parameters<typeof kungfuAdminApi.update>[1]) =>
      kungfuAdminApi.update(kungfuId, body),
    onSuccess: async () => {
      toast.success('心法信息已更新');
      setEditingKungfu(null);
      await invalidateKungfu();
    },
    onError: (error) => handleError(error, '更新心法失败'),
  });

  const deleteMutation = useMutation({
    mutationFn: (kungfuId: string) => kungfuAdminApi.delete(kungfuId),
    onSuccess: async () => {
      toast.success('心法已删除');
      await invalidateKungfu();
    },
    onError: (error) => handleError(error, '删除心法失败'),
    onSettled: () => setPendingKungfuId(null),
  });

  const totalPages = useMemo(() => {
    const total = kungfuQuery.data?.total ?? 0;
    return Math.max(1, Math.ceil(total / filters.pageSize));
  }, [filters.pageSize, kungfuQuery.data?.total]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">心法管理</h1>
        <p className="text-sm text-muted-foreground">
          管理游戏心法信息，仅超级管理员可访问。
        </p>
      </div>

      <KungfuFiltersComponent
        committedFilters={filters}
        onSearch={updateSearch}
        onReset={() => updateSearch(DEFAULT_KUNGFU_SEARCH)}
      />

      <div className="flex justify-end">
        <Button type="button" onClick={() => setCreating(true)}>
          新建心法
        </Button>
      </div>

      {kungfuQuery.isError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          加载心法列表失败，请稍后重试。
        </div>
      ) : null}

      <KungfuTableComponent
        items={kungfuQuery.data?.items ?? []}
        isLoading={kungfuQuery.isFetching}
        pendingKungfuId={pendingKungfuId}
        onEdit={setEditingKungfu}
        onDelete={(kungfu) => {
          if (!window.confirm(`确定删除心法 ${kungfu.name} 吗？`)) {
            return;
          }
          setPendingKungfuId(kungfu.id);
          deleteMutation.mutate(kungfu.id);
        }}
      />

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          共 {kungfuQuery.data?.total ?? 0} 条，第 {filters.page} / {totalPages}{' '}
          页
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={filters.page <= 1 || kungfuQuery.isFetching}
            onClick={() => updateSearch({ ...filters, page: filters.page - 1 })}
          >
            上一页
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={filters.page >= totalPages || kungfuQuery.isFetching}
            onClick={() => updateSearch({ ...filters, page: filters.page + 1 })}
          >
            下一页
          </Button>
        </div>
      </div>

      <KungfuFormDialogComponent
        mode="create"
        kungfu={null}
        open={creating}
        pending={createMutation.isPending}
        onOpenChange={setCreating}
        onSubmit={(values) => createMutation.mutate(values)}
      />

      <KungfuFormDialogComponent
        mode="edit"
        kungfu={editingKungfu}
        open={editingKungfu !== null}
        pending={updateMutation.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setEditingKungfu(null);
          }
        }}
        onSubmit={(values) => {
          if (!editingKungfu) {
            return;
          }
          updateMutation.mutate({
            kungfuId: editingKungfu.id,
            ...values,
          });
        }}
      />
    </div>
  );
}
