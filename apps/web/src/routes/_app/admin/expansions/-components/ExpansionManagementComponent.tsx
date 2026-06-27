import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import type { AdminExpansionListItem } from '#/lib/api/admin/expansions-admin-api';
import {
  expansionsAdminApi,
  expansionsAdminQueryKey,
} from '#/lib/api/admin/expansions-admin-api';
import { showMutationErrorToast } from '#/lib/utils/mutation-error';
import { Button } from '@/components/ui/button';
import { ExpansionFormDialogComponent } from './ExpansionFormDialogComponent';
import { ExpansionTableComponent } from './ExpansionTableComponent';

export function ExpansionManagementComponent() {
  const queryClient = useQueryClient();
  const [editingExpansion, setEditingExpansion] =
    useState<AdminExpansionListItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [pendingExpansionId, setPendingExpansionId] = useState<string | null>(
    null,
  );
  const [expandedExpansionId, setExpandedExpansionId] = useState<string | null>(
    null,
  );

  const expansionsQuery = useQuery({
    queryKey: expansionsAdminQueryKey,
    queryFn: () => expansionsAdminApi.list(),
  });

  const invalidateExpansions = async () => {
    await queryClient.invalidateQueries({ queryKey: expansionsAdminQueryKey });
  };

  const handleError = (error: unknown, fallbackMessage: string) => {
    showMutationErrorToast(error, fallbackMessage);
  };

  const createMutation = useMutation({
    mutationFn: expansionsAdminApi.create,
    onSuccess: async () => {
      toast.success('资料片已创建');
      setCreating(false);
      await invalidateExpansions();
    },
    onError: (error) => handleError(error, '创建资料片失败'),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      expansionId,
      ...body
    }: {
      expansionId: string;
      name: string;
      description: string | null;
      level: number;
      startDate: string;
      endDate: string | null;
    }) => expansionsAdminApi.update(expansionId, body),
    onSuccess: async () => {
      toast.success('资料片信息已更新');
      setEditingExpansion(null);
      await invalidateExpansions();
    },
    onError: (error) => handleError(error, '更新资料片失败'),
  });

  const deleteMutation = useMutation({
    mutationFn: (expansionId: string) => expansionsAdminApi.delete(expansionId),
    onSuccess: async () => {
      toast.success('资料片已删除');
      await invalidateExpansions();
    },
    onError: (error) => handleError(error, '删除资料片失败'),
    onSettled: () => setPendingExpansionId(null),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">资料片管理</h1>
          <p className="text-sm text-muted-foreground">
            管理游戏资料片信息，仅超级管理员可访问。
          </p>
        </div>
        <Button type="button" onClick={() => setCreating(true)}>
          新建资料片
        </Button>
      </div>

      {expansionsQuery.isError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          加载资料片列表失败，请稍后重试。
        </div>
      ) : null}

      <ExpansionTableComponent
        items={expansionsQuery.data?.items ?? []}
        isLoading={expansionsQuery.isFetching}
        pendingExpansionId={pendingExpansionId}
        expandedExpansionId={expandedExpansionId}
        onToggleExpand={(expansionId) => {
          setExpandedExpansionId((current) =>
            current === expansionId ? null : expansionId,
          );
        }}
        onEdit={setEditingExpansion}
        onDelete={(expansion) => {
          if (!window.confirm(`确定删除资料片 ${expansion.name} 吗？`)) {
            return;
          }
          setPendingExpansionId(expansion.id);
          deleteMutation.mutate(expansion.id);
        }}
      />

      <ExpansionFormDialogComponent
        mode="create"
        expansion={null}
        open={creating}
        pending={createMutation.isPending}
        onOpenChange={setCreating}
        onSubmit={(values) => createMutation.mutate(values)}
      />

      <ExpansionFormDialogComponent
        mode="edit"
        expansion={editingExpansion}
        open={editingExpansion !== null}
        pending={updateMutation.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setEditingExpansion(null);
          }
        }}
        onSubmit={(values) => {
          if (!editingExpansion) {
            return;
          }
          updateMutation.mutate({
            expansionId: editingExpansion.id,
            ...values,
          });
        }}
      />
    </div>
  );
}
