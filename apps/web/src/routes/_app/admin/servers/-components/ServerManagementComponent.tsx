import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import type { AdminGameServerListItem } from '#/lib/api/admin/game-servers-admin-api';
import {
  gameServersAdminApi,
  gameServersAdminQueryKey,
} from '#/lib/api/admin/game-servers-admin-api';
import { ApiRequestError } from '#/lib/api/request';
import { Button } from '@/components/ui/button';
import { ServerFormDialogComponent } from './ServerFormDialogComponent';
import { ServerTableComponent } from './ServerTableComponent';

export function ServerManagementComponent() {
  const queryClient = useQueryClient();
  const [editingServer, setEditingServer] =
    useState<AdminGameServerListItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [pendingServerId, setPendingServerId] = useState<string | null>(null);

  const serversQuery = useQuery({
    queryKey: gameServersAdminQueryKey,
    queryFn: () => gameServersAdminApi.list(),
  });

  const invalidateServers = async () => {
    await queryClient.invalidateQueries({ queryKey: gameServersAdminQueryKey });
  };

  const handleError = (error: unknown, fallbackMessage: string) => {
    if (error instanceof ApiRequestError) {
      toast.error(error.message);
      return;
    }
    toast.error(fallbackMessage);
  };

  const createMutation = useMutation({
    mutationFn: gameServersAdminApi.create,
    onSuccess: async () => {
      toast.success('服务器已创建');
      setCreating(false);
      await invalidateServers();
    },
    onError: (error) => handleError(error, '创建服务器失败'),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      ...body
    }: {
      id: string;
      serverId: string;
      zone: string;
      name: string;
      alias: string[];
    }) => gameServersAdminApi.update(id, body),
    onSuccess: async () => {
      toast.success('服务器信息已更新');
      setEditingServer(null);
      await invalidateServers();
    },
    onError: (error) => handleError(error, '更新服务器失败'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => gameServersAdminApi.delete(id),
    onSuccess: async () => {
      toast.success('服务器已删除');
      await invalidateServers();
    },
    onError: (error) => handleError(error, '删除服务器失败'),
    onSettled: () => setPendingServerId(null),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">服务器管理</h1>
          <p className="text-sm text-muted-foreground">
            管理游戏服务器信息，仅超级管理员可访问。
          </p>
        </div>
        <Button type="button" onClick={() => setCreating(true)}>
          新建服务器
        </Button>
      </div>

      {serversQuery.isError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          加载服务器列表失败，请稍后重试。
        </div>
      ) : null}

      <ServerTableComponent
        items={serversQuery.data?.items ?? []}
        isLoading={serversQuery.isFetching}
        pendingServerId={pendingServerId}
        onEdit={setEditingServer}
        onDelete={(server) => {
          if (!window.confirm(`确定删除服务器 ${server.name} 吗？`)) {
            return;
          }
          setPendingServerId(server.id);
          deleteMutation.mutate(server.id);
        }}
      />

      <ServerFormDialogComponent
        mode="create"
        server={null}
        open={creating}
        pending={createMutation.isPending}
        onOpenChange={setCreating}
        onSubmit={(values) => createMutation.mutate(values)}
      />

      <ServerFormDialogComponent
        mode="edit"
        server={editingServer}
        open={editingServer !== null}
        pending={updateMutation.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setEditingServer(null);
          }
        }}
        onSubmit={(values) => {
          if (!editingServer) {
            return;
          }
          updateMutation.mutate({
            id: editingServer.id,
            ...values,
          });
        }}
      />
    </div>
  );
}
