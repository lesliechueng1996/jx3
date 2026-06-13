import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import type { AdminExpansionListItem } from '#/lib/api/admin/expansions-admin-api';
import type { AdminSeasonListItem } from '#/lib/api/admin/seasons-admin-api';
import {
  seasonsAdminApi,
  seasonsAdminQueryKey,
} from '#/lib/api/admin/seasons-admin-api';
import { ApiRequestError } from '#/lib/api/request';
import { Button } from '@/components/ui/button';
import { SeasonFormDialogComponent } from './SeasonFormDialogComponent';
import { SeasonTableComponent } from './SeasonTableComponent';

type SeasonPanelComponentProps = {
  expansion: AdminExpansionListItem;
};

export function SeasonPanelComponent({ expansion }: SeasonPanelComponentProps) {
  const queryClient = useQueryClient();
  const [editingSeason, setEditingSeason] =
    useState<AdminSeasonListItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [pendingSeasonId, setPendingSeasonId] = useState<string | null>(null);

  const seasonsQuery = useQuery({
    queryKey: seasonsAdminQueryKey(expansion.id),
    queryFn: () => seasonsAdminApi.list(expansion.id),
  });

  const invalidateSeasons = async () => {
    await queryClient.invalidateQueries({
      queryKey: seasonsAdminQueryKey(expansion.id),
    });
  };

  const handleError = (error: unknown, fallbackMessage: string) => {
    if (error instanceof ApiRequestError) {
      toast.error(error.message);
      return;
    }
    toast.error(fallbackMessage);
  };

  const createMutation = useMutation({
    mutationFn: (body: Parameters<typeof seasonsAdminApi.create>[1]) =>
      seasonsAdminApi.create(expansion.id, body),
    onSuccess: async () => {
      toast.success('赛季已创建');
      setCreating(false);
      await invalidateSeasons();
    },
    onError: (error) => handleError(error, '创建赛季失败'),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      seasonId,
      ...body
    }: {
      seasonId: string;
      name: string;
      description: string | null;
      startDate: string;
      endDate: string | null;
      sortOrder: number;
    }) => seasonsAdminApi.update(expansion.id, seasonId, body),
    onSuccess: async () => {
      toast.success('赛季信息已更新');
      setEditingSeason(null);
      await invalidateSeasons();
    },
    onError: (error) => handleError(error, '更新赛季失败'),
  });

  const deleteMutation = useMutation({
    mutationFn: (seasonId: string) =>
      seasonsAdminApi.delete(expansion.id, seasonId),
    onSuccess: async () => {
      toast.success('赛季已删除');
      await invalidateSeasons();
    },
    onError: (error) => handleError(error, '删除赛季失败'),
    onSettled: () => setPendingSeasonId(null),
  });

  return (
    <div className="space-y-3 p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-medium">赛季列表</h3>
          <p className="text-xs text-muted-foreground">
            管理 {expansion.name} 下的赛季，日期需在资料片范围内。
          </p>
        </div>
        <Button type="button" size="sm" onClick={() => setCreating(true)}>
          新建赛季
        </Button>
      </div>

      {seasonsQuery.isError ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          加载赛季列表失败，请稍后重试。
        </div>
      ) : null}

      <SeasonTableComponent
        items={seasonsQuery.data?.items ?? []}
        isLoading={seasonsQuery.isFetching}
        pendingSeasonId={pendingSeasonId}
        onEdit={setEditingSeason}
        onDelete={(season) => {
          if (!window.confirm(`确定删除赛季 ${season.name} 吗？`)) {
            return;
          }
          setPendingSeasonId(season.id);
          deleteMutation.mutate(season.id);
        }}
      />

      <SeasonFormDialogComponent
        mode="create"
        season={null}
        open={creating}
        pending={createMutation.isPending}
        onOpenChange={setCreating}
        onSubmit={(values) => {
          const { sortOrder: _sortOrder, ...body } = values;
          createMutation.mutate(body);
        }}
      />

      <SeasonFormDialogComponent
        mode="edit"
        season={editingSeason}
        open={editingSeason !== null}
        pending={updateMutation.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setEditingSeason(null);
          }
        }}
        onSubmit={(values) => {
          if (!editingSeason) {
            return;
          }
          updateMutation.mutate({
            seasonId: editingSeason.id,
            ...values,
          });
        }}
      />
    </div>
  );
}
