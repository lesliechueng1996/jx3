import { hasStaffRole } from '@jx3/auth/roles';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getRouteApi } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  blocklistApi,
  blocklistQueryKey,
  type PlayerBlocklistItem,
  type RaidBrandBlocklistItem,
} from '#/lib/api/blocklist-api';
import {
  gameReferenceApi,
  gameReferenceQueryKey,
} from '#/lib/api/game-reference-api';
import { ApiRequestError } from '#/lib/api/request';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { AddPlayerDialogComponent } from './AddPlayerDialogComponent';
import { AddRaidBrandDialogComponent } from './AddRaidBrandDialogComponent';
import { PlayerBlocklistTableComponent } from './PlayerBlocklistTableComponent';
import { RaidBrandBlocklistTableComponent } from './RaidBrandBlocklistTableComponent';

const blocklistRouteApi = getRouteApi('/_app/blocklist/');

type BlocklistTab = 'brands' | 'players';

export function BlocklistComponent() {
  const { session } = blocklistRouteApi.useRouteContext();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<BlocklistTab>('brands');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [creatingBrand, setCreatingBrand] = useState(false);
  const [creatingPlayer, setCreatingPlayer] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const canDelete = hasStaffRole(session.user.role);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const brandsQuery = useQuery({
    queryKey: [...blocklistQueryKey, 'brands', debouncedSearch],
    queryFn: () => blocklistApi.listRaidBrands(debouncedSearch),
    enabled: tab === 'brands',
  });

  const playersQuery = useQuery({
    queryKey: [...blocklistQueryKey, 'players', debouncedSearch],
    queryFn: () => blocklistApi.listPlayers({ q: debouncedSearch }),
    enabled: tab === 'players',
  });

  const referenceQuery = useQuery({
    queryKey: gameReferenceQueryKey,
    queryFn: async () => ({
      servers: (await gameReferenceApi.listGameServers()).items,
      schools: (await gameReferenceApi.listSchoolOptions()).items,
    }),
  });

  const invalidateBlocklist = async () => {
    await queryClient.invalidateQueries({ queryKey: blocklistQueryKey });
  };

  const handleError = (error: unknown, fallbackMessage: string) => {
    if (error instanceof ApiRequestError) {
      if (error.code === 'CONFLICT') {
        toast.error('该记录已在避雷名单中');
        return;
      }
      toast.error(error.message);
      return;
    }
    toast.error(fallbackMessage);
  };

  const createBrandMutation = useMutation({
    mutationFn: blocklistApi.createRaidBrand,
    onSuccess: async () => {
      toast.success('团牌已加入避雷名单');
      setCreatingBrand(false);
      await invalidateBlocklist();
    },
    onError: (error) => handleError(error, '添加团牌失败'),
  });

  const createPlayerMutation = useMutation({
    mutationFn: blocklistApi.createPlayer,
    onSuccess: async () => {
      toast.success('人员已加入避雷名单');
      setCreatingPlayer(false);
      await invalidateBlocklist();
    },
    onError: (error) => handleError(error, '添加人员失败'),
  });

  const deleteBrandMutation = useMutation({
    mutationFn: blocklistApi.deleteRaidBrand,
    onSuccess: async () => {
      toast.success('团牌已移除');
      await invalidateBlocklist();
    },
    onError: (error) => handleError(error, '删除团牌失败'),
    onSettled: () => setPendingDeleteId(null),
  });

  const deletePlayerMutation = useMutation({
    mutationFn: blocklistApi.deletePlayer,
    onSuccess: async () => {
      toast.success('人员已移除');
      await invalidateBlocklist();
    },
    onError: (error) => handleError(error, '删除人员失败'),
    onSettled: () => setPendingDeleteId(null),
  });

  const handleDeleteBrand = (item: RaidBrandBlocklistItem) => {
    if (!window.confirm(`确定移除团牌「${item.name}」吗？`)) {
      return;
    }
    setPendingDeleteId(item.id);
    deleteBrandMutation.mutate(item.id);
  };

  const handleDeletePlayer = (item: PlayerBlocklistItem) => {
    if (
      !window.confirm(
        `确定移除「${item.characterName} · ${item.serverName}」吗？`,
      )
    ) {
      return;
    }
    setPendingDeleteId(item.id);
    deletePlayerMutation.mutate(item.id);
  };

  const isLoading =
    tab === 'brands' ? brandsQuery.isLoading : playersQuery.isLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">避雷名单</h1>
        <p className="text-sm text-muted-foreground">
          公共避雷名单，所有登录用户可查看和新增，管理员可删除。
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-md border border-border p-1">
          <Button
            type="button"
            size="sm"
            variant={tab === 'brands' ? 'default' : 'ghost'}
            className={cn(tab !== 'brands' && 'text-muted-foreground')}
            onClick={() => setTab('brands')}
          >
            团牌
          </Button>
          <Button
            type="button"
            size="sm"
            variant={tab === 'players' ? 'default' : 'ghost'}
            className={cn(tab !== 'players' && 'text-muted-foreground')}
            onClick={() => setTab('players')}
          >
            个人
          </Button>
        </div>

        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={tab === 'brands' ? '搜索团牌名称' : '搜索角色名'}
          className="max-w-xs"
        />

        <div className="ml-auto">
          <Button
            type="button"
            onClick={() =>
              tab === 'brands'
                ? setCreatingBrand(true)
                : setCreatingPlayer(true)
            }
          >
            {tab === 'brands' ? '新增团牌' : '新增个人'}
          </Button>
        </div>
      </div>

      {tab === 'brands' ? (
        <RaidBrandBlocklistTableComponent
          items={brandsQuery.data?.items ?? []}
          isLoading={isLoading}
          canDelete={canDelete}
          pendingDeleteId={pendingDeleteId}
          onDelete={handleDeleteBrand}
        />
      ) : (
        <PlayerBlocklistTableComponent
          items={playersQuery.data?.items ?? []}
          isLoading={isLoading}
          canDelete={canDelete}
          pendingDeleteId={pendingDeleteId}
          onDelete={handleDeletePlayer}
        />
      )}

      <AddRaidBrandDialogComponent
        open={creatingBrand}
        pending={createBrandMutation.isPending}
        onOpenChange={setCreatingBrand}
        onSubmit={(values) => createBrandMutation.mutate(values)}
      />

      <AddPlayerDialogComponent
        open={creatingPlayer}
        pending={createPlayerMutation.isPending}
        servers={referenceQuery.data?.servers ?? []}
        schools={referenceQuery.data?.schools ?? []}
        onOpenChange={setCreatingPlayer}
        onSubmit={(values) => createPlayerMutation.mutate(values)}
      />
    </div>
  );
}
