import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getRouteApi } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { AdminDungeonListItem } from '#/lib/api/admin/dungeons-admin-api';
import {
  dungeonsAdminApi,
  dungeonsAdminQueryKey,
} from '#/lib/api/admin/dungeons-admin-api';
import { showMutationErrorToast } from '#/lib/utils/mutation-error';
import { toRouteSearch } from '#/routes/_app/admin/-components/admin-list-search';
import { Button } from '@/components/ui/button';
import { DungeonFiltersComponent } from './DungeonFiltersComponent';
import { DungeonFormDialogComponent } from './DungeonFormDialogComponent';
import { DungeonTableComponent } from './DungeonTableComponent';
import {
  DEFAULT_DUNGEON_SEARCH,
  type DungeonSearch,
} from './dungeon-search-schema';

const dungeonRouteApi = getRouteApi('/_app/admin/dungeons/');

export function DungeonManagementComponent() {
  const navigate = dungeonRouteApi.useNavigate();
  const filters = dungeonRouteApi.useSearch();
  const queryClient = useQueryClient();
  const [editingDungeon, setEditingDungeon] =
    useState<AdminDungeonListItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [pendingDungeonId, setPendingDungeonId] = useState<string | null>(null);

  const updateSearch = (nextFilters: DungeonSearch) => {
    navigate({
      to: '.',
      search: toRouteSearch(nextFilters, DEFAULT_DUNGEON_SEARCH),
    });
  };

  const dungeonsQuery = useQuery({
    queryKey: [...dungeonsAdminQueryKey, filters],
    queryFn: () => dungeonsAdminApi.list(filters),
  });

  const invalidateDungeons = async () => {
    await queryClient.invalidateQueries({ queryKey: dungeonsAdminQueryKey });
  };

  const handleError = (error: unknown, fallbackMessage: string) => {
    showMutationErrorToast(error, fallbackMessage);
  };

  const createMutation = useMutation({
    mutationFn: dungeonsAdminApi.create,
    onSuccess: async () => {
      toast.success('副本已创建');
      setCreating(false);
      await invalidateDungeons();
    },
    onError: (error) => handleError(error, '创建副本失败'),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      dungeonId,
      ...body
    }: { dungeonId: string } & Parameters<typeof dungeonsAdminApi.update>[1]) =>
      dungeonsAdminApi.update(dungeonId, body),
    onSuccess: async () => {
      toast.success('副本信息已更新');
      setEditingDungeon(null);
      await invalidateDungeons();
    },
    onError: (error) => handleError(error, '更新副本失败'),
  });

  const deleteMutation = useMutation({
    mutationFn: (dungeonId: string) => dungeonsAdminApi.delete(dungeonId),
    onSuccess: async () => {
      toast.success('副本已删除');
      await invalidateDungeons();
    },
    onError: (error) => handleError(error, '删除副本失败'),
    onSettled: () => setPendingDungeonId(null),
  });

  const totalPages = useMemo(() => {
    const total = dungeonsQuery.data?.total ?? 0;
    return Math.max(1, Math.ceil(total / filters.pageSize));
  }, [filters.pageSize, dungeonsQuery.data?.total]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">副本管理</h1>
        <p className="text-sm text-muted-foreground">
          管理游戏副本信息，仅超级管理员可访问。
        </p>
      </div>

      <DungeonFiltersComponent
        committedFilters={filters}
        onSearch={updateSearch}
        onReset={() => updateSearch(DEFAULT_DUNGEON_SEARCH)}
      />

      <div className="flex justify-end">
        <Button type="button" onClick={() => setCreating(true)}>
          新建副本
        </Button>
      </div>

      {dungeonsQuery.isError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          加载副本列表失败，请稍后重试。
        </div>
      ) : null}

      <DungeonTableComponent
        items={dungeonsQuery.data?.items ?? []}
        isLoading={dungeonsQuery.isFetching}
        pendingDungeonId={pendingDungeonId}
        onEdit={setEditingDungeon}
        onDelete={(dungeon) => {
          if (!window.confirm(`确定删除副本 ${dungeon.name} 吗？`)) {
            return;
          }
          setPendingDungeonId(dungeon.id);
          deleteMutation.mutate(dungeon.id);
        }}
      />

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          共 {dungeonsQuery.data?.total ?? 0} 条，第 {filters.page} /{' '}
          {totalPages} 页
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={filters.page <= 1 || dungeonsQuery.isFetching}
            onClick={() => updateSearch({ ...filters, page: filters.page - 1 })}
          >
            上一页
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={filters.page >= totalPages || dungeonsQuery.isFetching}
            onClick={() => updateSearch({ ...filters, page: filters.page + 1 })}
          >
            下一页
          </Button>
        </div>
      </div>

      <DungeonFormDialogComponent
        mode="create"
        dungeon={null}
        open={creating}
        pending={createMutation.isPending}
        onOpenChange={setCreating}
        onSubmit={(values) => createMutation.mutate(values)}
      />

      <DungeonFormDialogComponent
        mode="edit"
        dungeon={editingDungeon}
        open={editingDungeon !== null}
        pending={updateMutation.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setEditingDungeon(null);
          }
        }}
        onSubmit={(values) => {
          if (!editingDungeon) {
            return;
          }
          updateMutation.mutate({
            dungeonId: editingDungeon.id,
            ...values,
          });
        }}
      />
    </div>
  );
}
