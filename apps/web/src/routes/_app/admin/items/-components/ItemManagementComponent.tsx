import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getRouteApi } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { AdminGameItemListItem } from '#/lib/api/admin/game-items-admin-api';
import {
  gameItemsAdminApi,
  gameItemsAdminQueryKey,
} from '#/lib/api/admin/game-items-admin-api';
import { ApiRequestError } from '#/lib/api/request';
import { toRouteSearch } from '#/routes/_app/admin/-components/admin-list-search';
import { Button } from '@/components/ui/button';
import { ItemFiltersComponent } from './ItemFiltersComponent';
import { ItemFormDialogComponent } from './ItemFormDialogComponent';
import { ItemTableComponent } from './ItemTableComponent';
import { DEFAULT_ITEM_SEARCH, type ItemSearch } from './item-search-schema';

const itemsRouteApi = getRouteApi('/_app/admin/items/');

export function ItemManagementComponent() {
  const navigate = itemsRouteApi.useNavigate();
  const filters = itemsRouteApi.useSearch();
  const queryClient = useQueryClient();
  const [editingItem, setEditingItem] = useState<AdminGameItemListItem | null>(
    null,
  );
  const [creating, setCreating] = useState(false);
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);

  const updateSearch = (nextFilters: ItemSearch) => {
    navigate({
      to: '.',
      search: toRouteSearch(nextFilters, DEFAULT_ITEM_SEARCH),
    });
  };

  const itemsQuery = useQuery({
    queryKey: [...gameItemsAdminQueryKey, filters],
    queryFn: () => gameItemsAdminApi.list(filters),
  });

  const invalidateItems = async () => {
    await queryClient.invalidateQueries({ queryKey: gameItemsAdminQueryKey });
  };

  const handleError = (error: unknown, fallbackMessage: string) => {
    if (error instanceof ApiRequestError) {
      toast.error(error.message);
      return;
    }
    toast.error(fallbackMessage);
  };

  const createMutation = useMutation({
    mutationFn: gameItemsAdminApi.create,
    onSuccess: async () => {
      toast.success('物品已创建');
      setCreating(false);
      await invalidateItems();
    },
    onError: (error) => handleError(error, '创建物品失败'),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      itemId,
      ...body
    }: { itemId: string } & Parameters<typeof gameItemsAdminApi.update>[1]) =>
      gameItemsAdminApi.update(itemId, body),
    onSuccess: async () => {
      toast.success('物品信息已更新');
      setEditingItem(null);
      await invalidateItems();
    },
    onError: (error) => handleError(error, '更新物品失败'),
  });

  const deleteMutation = useMutation({
    mutationFn: (itemId: string) => gameItemsAdminApi.delete(itemId),
    onSuccess: async () => {
      toast.success('物品已删除');
      await invalidateItems();
    },
    onError: (error) => handleError(error, '删除物品失败'),
    onSettled: () => setPendingItemId(null),
  });

  const totalPages = useMemo(() => {
    const total = itemsQuery.data?.total ?? 0;
    return Math.max(1, Math.ceil(total / filters.pageSize));
  }, [filters.pageSize, itemsQuery.data?.total]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">物品管理</h1>
        <p className="text-sm text-muted-foreground">
          管理游戏物品信息，仅超级管理员可访问。
        </p>
      </div>

      <ItemFiltersComponent
        committedFilters={filters}
        onSearch={updateSearch}
        onReset={() => updateSearch(DEFAULT_ITEM_SEARCH)}
      />

      <div className="flex justify-end">
        <Button type="button" onClick={() => setCreating(true)}>
          新建物品
        </Button>
      </div>

      {itemsQuery.isError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          加载物品列表失败，请稍后重试。
        </div>
      ) : null}

      <ItemTableComponent
        items={itemsQuery.data?.items ?? []}
        isLoading={itemsQuery.isFetching}
        pendingItemId={pendingItemId}
        onEdit={setEditingItem}
        onDelete={(item) => {
          if (!window.confirm(`确定删除物品 ${item.name} 吗？`)) {
            return;
          }
          setPendingItemId(item.id);
          deleteMutation.mutate(item.id);
        }}
      />

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          共 {itemsQuery.data?.total ?? 0} 条，第 {filters.page} / {totalPages}{' '}
          页
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={filters.page <= 1 || itemsQuery.isFetching}
            onClick={() => updateSearch({ ...filters, page: filters.page - 1 })}
          >
            上一页
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={filters.page >= totalPages || itemsQuery.isFetching}
            onClick={() => updateSearch({ ...filters, page: filters.page + 1 })}
          >
            下一页
          </Button>
        </div>
      </div>

      <ItemFormDialogComponent
        mode="create"
        item={null}
        open={creating}
        pending={createMutation.isPending}
        onOpenChange={setCreating}
        onSubmit={(values) => createMutation.mutate(values)}
      />

      <ItemFormDialogComponent
        mode="edit"
        item={editingItem}
        open={editingItem !== null}
        pending={updateMutation.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setEditingItem(null);
          }
        }}
        onSubmit={(values) => {
          if (!editingItem) {
            return;
          }
          updateMutation.mutate({
            itemId: editingItem.id,
            ...values,
          });
        }}
      />
    </div>
  );
}
