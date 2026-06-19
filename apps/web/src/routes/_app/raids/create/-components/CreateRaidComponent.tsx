import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  gameReferenceApi,
  gameReferenceQueryKey,
} from '#/lib/api/game-reference-api';
import { type RaidRunResponse, raidRunsApi } from '#/lib/api/raid-runs-api';
import { ApiRequestError } from '#/lib/api/request';
import { Button } from '@/components/ui/button';
import { LootPanelComponent } from './LootPanelComponent';
import { RaidGridComponent } from './RaidGridComponent';
import { RaidRunFormComponent } from './RaidRunFormComponent';
import type { RaidRunDraft, SignupDraft } from './raid-run-form-schema';
import {
  createDraftSaveSchema,
  createPublishSchema,
} from './raid-run-form-schema';
import {
  applyReservedRoles,
  applySignupPatch,
  createInitialRaidRunDraft,
  findSignup,
  resizeDraftForPlayerLimit,
  swapSignupsAt,
  syncReservedCounts,
} from './raid-signup-draft';
import { DEFAULT_PLAYER_LIMIT, isReservedTotalValid } from './role-slot-utils';
import { SignupPanelComponent } from './SignupPanelComponent';

type CreateRaidComponentProps = {
  mode: 'create' | 'draft';
  raidRunId?: string;
  initialData?: RaidRunResponse;
};

const toDraftFromResponse = (response: RaidRunResponse): RaidRunDraft => ({
  name: response.name,
  description: response.description,
  dungeonId: response.dungeonId,
  gatherTime: response.gatherTime,
  startTime: response.startTime,
  endTime: response.endTime,
  reservedTank: response.reservedTank,
  reservedHealer: response.reservedHealer,
  reservedDps: response.reservedDps,
  reservedBoss: response.reservedBoss,
  remark: response.remark,
  signups: response.signups.map((signup) => ({
    groupNumber: signup.groupNumber ?? 1,
    positionNumber: signup.positionNumber ?? 1,
    role: signup.role,
    characterName: signup.characterName,
    serverId: signup.serverId,
    schoolId: signup.schoolId,
    kungfuId: signup.kungfuId,
    isLeader: signup.isLeader,
    isDarkRun: signup.isDarkRun,
    isFormationCore: signup.isFormationCore,
    remark: signup.remark,
  })),
});

export function CreateRaidComponent({
  mode,
  raidRunId,
  initialData,
}: CreateRaidComponentProps) {
  const navigate = useNavigate();
  const [draft, setDraft] = useState<RaidRunDraft>(() =>
    initialData
      ? toDraftFromResponse(initialData)
      : createInitialRaidRunDraft(),
  );
  const [savedSnapshot, setSavedSnapshot] = useState(() =>
    JSON.stringify(initialData ? toDraftFromResponse(initialData) : draft),
  );
  const [status, setStatus] = useState(initialData?.status ?? 'pending');
  const [signupResponses, setSignupResponses] = useState(
    initialData?.signups ?? [],
  );
  const [selected, setSelected] = useState<{
    groupNumber: number;
    positionNumber: number;
  } | null>(null);

  const dungeonQuery = useQuery({
    queryKey: [...gameReferenceQueryKey, 'dungeon', draft.dungeonId],
    queryFn: async () => {
      const response = await gameReferenceApi.searchDungeons('');
      return response.items.find((item) => item.id === draft.dungeonId) ?? null;
    },
    enabled: Boolean(draft.dungeonId),
  });

  const playerLimit = dungeonQuery.data?.playerLimit ?? DEFAULT_PLAYER_LIMIT;

  useEffect(() => {
    const dungeon = dungeonQuery.data;
    if (!dungeon) {
      return;
    }

    if (draft.signups.length === dungeon.playerLimit) {
      return;
    }

    setDraft((current) =>
      resizeDraftForPlayerLimit(current, dungeon.playerLimit),
    );
  }, [draft.signups.length, dungeonQuery.data]);

  const draftSaveSchema = useMemo(
    () => createDraftSaveSchema(playerLimit),
    [playerLimit],
  );
  const publishSchema = useMemo(
    () => createPublishSchema(playerLimit),
    [playerLimit],
  );

  const isDraft = status === 'pending';
  const isEditable =
    status === 'pending' || status === 'recruiting' || status === 'ongoing';
  const isTerminal = status === 'completed' || status === 'cancelled';
  const isLootEditable = status === 'ongoing' || status === 'completed';
  const isDirty = JSON.stringify(draft) !== savedSnapshot;
  const canSave = isEditable && isReservedTotalValid(draft, playerLimit);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isDirty && isEditable) {
        event.preventDefault();
        event.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty, isEditable]);

  const selectedSignup = useMemo((): SignupDraft | null => {
    if (!selected) {
      return null;
    }

    return (
      findSignup(
        draft.signups,
        selected.groupNumber,
        selected.positionNumber,
      ) ?? null
    );
  }, [draft.signups, selected]);

  const serversQuery = useQuery({
    queryKey: [...gameReferenceQueryKey, 'servers'],
    queryFn: () => gameReferenceApi.listGameServers(),
  });

  const schoolsQuery = useQuery({
    queryKey: [...gameReferenceQueryKey, 'schools'],
    queryFn: () => gameReferenceApi.listSchoolOptions(),
  });

  const kungfuQuery = useQuery({
    queryKey: [...gameReferenceQueryKey, 'kungfu', 'all'],
    queryFn: () => gameReferenceApi.listAllKungfuOptions(),
  });

  const serverNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const server of serversQuery.data?.items ?? []) {
      map.set(server.id, server.name);
    }
    return map;
  }, [serversQuery.data?.items]);

  const kungfuIconById = useMemo(() => {
    const map = new Map<string, string | null>();
    for (const kungfu of kungfuQuery.data?.items ?? []) {
      map.set(kungfu.id, kungfu.icon);
    }
    return map;
  }, [kungfuQuery.data?.items]);

  const handleError = (error: unknown, fallbackMessage: string) => {
    if (error instanceof ApiRequestError) {
      toast.error(error.message);
      return;
    }
    toast.error(fallbackMessage);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const parsed = isDraft
        ? draftSaveSchema.parse(draft)
        : publishSchema.parse(draft);
      const payload = syncReservedCounts(parsed);
      if (mode === 'create' && !raidRunId) {
        return raidRunsApi.create(payload);
      }
      if (!raidRunId) {
        throw new Error('缺少草稿 ID');
      }
      return raidRunsApi.patch(raidRunId, payload);
    },
    onSuccess: async (response) => {
      const nextDraft = toDraftFromResponse(response);
      setDraft(nextDraft);
      setSavedSnapshot(JSON.stringify(nextDraft));
      setStatus(response.status);
      setSignupResponses(response.signups);
      toast.success(isDraft ? '已暂存' : '已保存');

      if (mode === 'create') {
        await navigate({
          to: '/raids/create/$raidRunId',
          params: { raidRunId: response.id },
        });
      }
    },
    onError: (error) => handleError(error, isDraft ? '暂存失败' : '保存失败'),
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      if (!raidRunId) {
        throw new Error('请先暂存');
      }

      publishSchema.parse(draft);

      if (isDirty) {
        const parsed = draftSaveSchema.parse(draft);
        await raidRunsApi.patch(raidRunId, syncReservedCounts(parsed));
      }

      return raidRunsApi.publish(raidRunId);
    },
    onSuccess: (response) => {
      const nextDraft = toDraftFromResponse(response);
      setDraft(nextDraft);
      setSavedSnapshot(JSON.stringify(nextDraft));
      setStatus(response.status);
      setSignupResponses(response.signups);
      toast.success('开团已发布');
    },
    onError: (error) => handleError(error, '发布失败'),
  });

  const updateDraft = (next: RaidRunDraft) => {
    setDraft(applyReservedRoles(next, playerLimit));
  };

  const updateSignup = (patch: Partial<RaidRunDraft['signups'][number]>) => {
    if (!selected) {
      return;
    }

    setDraft(
      applySignupPatch(
        draft,
        selected.groupNumber,
        selected.positionNumber,
        patch,
      ),
    );
  };

  const handleSwap = (
    from: { groupNumber: number; positionNumber: number },
    to: { groupNumber: number; positionNumber: number },
  ) => {
    setDraft(
      syncReservedCounts({
        ...draft,
        signups: swapSignupsAt(draft.signups, from, to),
      }),
    );
    setSelected(to);
  };

  const publishDisabled = mode === 'create' || !raidRunId || !isDraft;
  const publishHint =
    mode === 'create' ? '请先暂存后再发布' : !isDraft ? '已发布' : null;
  const saveLabel = isDraft ? '暂存' : '保存';
  const savePendingLabel = isDraft ? '暂存中…' : '保存中…';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">我要开团</h1>
        <p className="text-sm text-muted-foreground">
          填写开团信息、布置
          {draft.dungeonId ? `${playerLimit} 人` : '团队'}布局，并预填部分团员。
        </p>
        {isTerminal ? (
          <p className="mt-3 rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground">
            该团已结束，不可编辑。
          </p>
        ) : null}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(280px,320px)_1fr_minmax(280px,320px)]">
        <section className="rounded-lg border p-4">
          <h2 className="mb-4 text-sm font-medium text-muted-foreground">
            开团信息
          </h2>
          <RaidRunFormComponent
            value={draft}
            disabled={!isEditable}
            onChange={updateDraft}
          />
        </section>

        <section className="flex flex-col gap-4">
          <div className="rounded-lg border p-4">
            <h2 className="mb-4 text-sm font-medium text-muted-foreground">
              团队布局
            </h2>
            <RaidGridComponent
              signups={draft.signups}
              selected={selected}
              disabled={!isEditable}
              playerLimit={playerLimit}
              serverNameById={serverNameById}
              kungfuIconById={kungfuIconById}
              onSelect={(groupNumber, positionNumber) =>
                setSelected({ groupNumber, positionNumber })
              }
              onSwap={handleSwap}
            />
          </div>

          {raidRunId ? (
            <div className="rounded-lg border p-4">
              <LootPanelComponent
                raidRunId={raidRunId}
                signups={signupResponses}
                initialLoot={initialData?.loot ?? []}
                wage={{
                  totalIncome: initialData?.totalIncome ?? null,
                  wagePerPerson: initialData?.wagePerPerson ?? null,
                }}
                gameRaidId={initialData?.gameRaidId ?? null}
                editable={isLootEditable}
              />
            </div>
          ) : null}
        </section>

        <section className="rounded-lg border p-4">
          <h2 className="mb-4 text-sm font-medium text-muted-foreground">
            团员属性
          </h2>
          <SignupPanelComponent
            signup={selectedSignup}
            disabled={!isEditable}
            onChange={updateSignup}
            servers={serversQuery.data?.items ?? []}
            schools={schoolsQuery.data?.items ?? []}
            kungfus={kungfuQuery.data?.items ?? []}
          />
        </section>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="secondary"
          disabled={!canSave || saveMutation.isPending || !isEditable}
          onClick={() => saveMutation.mutate()}
        >
          {saveMutation.isPending ? savePendingLabel : saveLabel}
        </Button>
        <Button
          disabled={publishDisabled || publishMutation.isPending}
          onClick={() => publishMutation.mutate()}
        >
          {publishMutation.isPending ? '发布中…' : '发布开团'}
        </Button>
        {publishHint ? (
          <span className="text-sm text-muted-foreground">{publishHint}</span>
        ) : null}
        {isDirty && isEditable ? (
          <span className="text-sm text-amber-600">有未保存的修改</span>
        ) : null}
      </div>
    </div>
  );
}
