import { useMutation } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { gameItemsApi } from '#/lib/api/game-items-api';
import type {
  RaidLootItem,
  RaidRunWage,
  RaidSignupResponse,
} from '#/lib/api/raid-runs-api';
import { raidRunsApi } from '#/lib/api/raid-runs-api';
import { ApiRequestError } from '#/lib/api/request';
import { Button } from '@/components/ui/button';
import { AddLootDialogComponent } from './AddLootDialogComponent';
import {
  formatGoldAmount,
  ITEM_QUALITY_CLASS,
  ITEM_QUALITY_LABELS,
} from './item-utils';
import { RecordDungeonIdDialogComponent } from './RecordDungeonIdDialogComponent';
import { RecordWageDialogComponent } from './RecordWageDialogComponent';

type LootPanelComponentProps = {
  raidRunId: string;
  signups: RaidSignupResponse[];
  initialLoot: RaidLootItem[];
  wage: RaidRunWage;
  gameRaidId: string | null;
  editable: boolean;
};

export function LootPanelComponent({
  raidRunId,
  signups,
  initialLoot,
  wage,
  gameRaidId,
  editable,
}: LootPanelComponentProps) {
  const [loot, setLoot] = useState(initialLoot);
  const [currentWage, setCurrentWage] = useState(wage);
  const [currentGameRaidId, setCurrentGameRaidId] = useState(gameRaidId);
  const [addOpen, setAddOpen] = useState(false);
  const [editLoot, setEditLoot] = useState<RaidLootItem | null>(null);
  const [wageOpen, setWageOpen] = useState(false);
  const [gameRaidIdOpen, setGameRaidIdOpen] = useState(false);

  useEffect(() => {
    setLoot(initialLoot);
  }, [initialLoot]);

  useEffect(() => {
    setCurrentWage(wage);
  }, [wage]);

  useEffect(() => {
    setCurrentGameRaidId(gameRaidId);
  }, [gameRaidId]);

  const handleError = (error: unknown, fallbackMessage: string) => {
    if (error instanceof ApiRequestError) {
      toast.error(error.message);
      return;
    }
    toast.error(fallbackMessage);
  };

  const createLootMutation = useMutation({
    mutationFn: (payload: {
      itemId: string;
      quantity: number;
      winnerSignupId: string | null;
      price: number | null;
      remark: string | null;
    }) => raidRunsApi.createLoot(raidRunId, payload),
    onSuccess: (created) => {
      setLoot((current) => [...current, created]);
      setAddOpen(false);
      toast.success('掉落已添加');
    },
    onError: (error) => handleError(error, '添加掉落失败'),
  });

  const patchLootMutation = useMutation({
    mutationFn: ({
      lootId,
      payload,
    }: {
      lootId: string;
      payload: {
        quantity: number;
        winnerSignupId: string | null;
        price: number | null;
        remark: string | null;
      };
    }) => raidRunsApi.patchLoot(raidRunId, lootId, payload),
    onSuccess: (updated) => {
      setLoot((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setEditLoot(null);
      toast.success('掉落已更新');
    },
    onError: (error) => handleError(error, '更新掉落失败'),
  });

  const deleteLootMutation = useMutation({
    mutationFn: (lootId: string) => raidRunsApi.deleteLoot(raidRunId, lootId),
    onSuccess: (_result, lootId) => {
      setLoot((current) => current.filter((item) => item.id !== lootId));
      toast.success('掉落已删除');
    },
    onError: (error) => handleError(error, '删除掉落失败'),
  });

  const wageMutation = useMutation({
    mutationFn: (payload: RaidRunWage) =>
      raidRunsApi.patchWage(raidRunId, payload),
    onSuccess: (updated) => {
      setCurrentWage(updated);
      setWageOpen(false);
      toast.success('工资已保存');
    },
    onError: (error) => handleError(error, '保存工资失败'),
  });

  const gameRaidIdMutation = useMutation({
    mutationFn: (nextGameRaidId: string | null) =>
      raidRunsApi.patchGameRaidId(raidRunId, { gameRaidId: nextGameRaidId }),
    onSuccess: (updated) => {
      setCurrentGameRaidId(updated.gameRaidId);
      setGameRaidIdOpen(false);
      toast.success('副本 ID 已保存');
    },
    onError: (error) => handleError(error, '保存副本 ID 失败'),
  });

  const lootPending =
    createLootMutation.isPending || patchLootMutation.isPending;

  const wageSummary =
    currentWage.totalIncome || currentWage.wagePerPerson ? (
      <p className="text-sm text-muted-foreground">
        金团总计 {formatGoldAmount(currentWage.totalIncome)} 金 · 人均{' '}
        {formatGoldAmount(currentWage.wagePerPerson)} 金
      </p>
    ) : null;

  const gameRaidIdSummary = currentGameRaidId ? (
    <p className="text-sm text-muted-foreground">
      副本 ID：{currentGameRaidId}
    </p>
  ) : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-sm font-medium text-muted-foreground">
            重要掉落
          </h2>
          {gameRaidIdSummary}
          {wageSummary}
        </div>
        {editable ? (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setGameRaidIdOpen(true)}
            >
              记录副本ID
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setWageOpen(true)}
            >
              记录工资
            </Button>
            <Button size="sm" onClick={() => setAddOpen(true)}>
              添加掉落
            </Button>
          </div>
        ) : null}
      </div>

      {loot.length === 0 ? (
        <p className="text-sm text-muted-foreground">暂无掉落记录</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-2 pr-3 font-medium">物品</th>
                <th className="py-2 pr-3 font-medium">数量</th>
                <th className="py-2 pr-3 font-medium">获得者</th>
                <th className="py-2 pr-3 font-medium">成交价</th>
                {editable ? <th className="py-2 font-medium">操作</th> : null}
              </tr>
            </thead>
            <tbody>
              {loot.map((item) => (
                <tr key={item.id} className="border-b last:border-b-0">
                  <td className="py-2 pr-3">
                    <span className={ITEM_QUALITY_CLASS[item.itemQuality]}>
                      [{ITEM_QUALITY_LABELS[item.itemQuality]}]
                    </span>{' '}
                    {item.itemName}
                  </td>
                  <td className="py-2 pr-3">{item.quantity}</td>
                  <td className="py-2 pr-3">
                    {item.winnerCharacterName ? (
                      <>
                        {item.winnerCharacterName}
                        {item.winnerServerName
                          ? ` · ${item.winnerServerName}`
                          : ''}
                      </>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="py-2 pr-3">
                    {item.price === null
                      ? '—'
                      : `${formatGoldAmount(item.price)} 金`}
                  </td>
                  {editable ? (
                    <td className="py-2">
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2"
                          onClick={() => setEditLoot(item)}
                        >
                          编辑
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-destructive"
                          disabled={deleteLootMutation.isPending}
                          onClick={() => deleteLootMutation.mutate(item.id)}
                        >
                          删除
                        </Button>
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AddLootDialogComponent
        open={addOpen}
        mode="create"
        raidRunId={raidRunId}
        loot={null}
        signups={signups}
        pending={lootPending}
        onOpenChange={setAddOpen}
        onSubmit={(payload) => createLootMutation.mutate(payload)}
        onCreateItem={(values) => gameItemsApi.create(values)}
      />

      <AddLootDialogComponent
        open={editLoot !== null}
        mode="edit"
        raidRunId={raidRunId}
        loot={editLoot}
        signups={signups}
        pending={lootPending}
        onOpenChange={(open) => {
          if (!open) {
            setEditLoot(null);
          }
        }}
        onSubmit={(payload) => {
          if (!editLoot) {
            return;
          }
          patchLootMutation.mutate({
            lootId: editLoot.id,
            payload,
          });
        }}
        onCreateItem={(values) => gameItemsApi.create(values)}
      />

      <RecordWageDialogComponent
        open={wageOpen}
        wage={currentWage}
        signups={signups}
        pending={wageMutation.isPending}
        onOpenChange={setWageOpen}
        onSubmit={(payload) => wageMutation.mutate(payload)}
      />

      <RecordDungeonIdDialogComponent
        open={gameRaidIdOpen}
        gameRaidId={currentGameRaidId}
        pending={gameRaidIdMutation.isPending}
        onOpenChange={setGameRaidIdOpen}
        onSubmit={(nextGameRaidId) => gameRaidIdMutation.mutate(nextGameRaidId)}
      />
    </div>
  );
}
