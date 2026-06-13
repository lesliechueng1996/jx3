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
import { RaidGridComponent } from './RaidGridComponent';
import { RaidRunFormComponent } from './RaidRunFormComponent';
import type { RaidRunDraft, SignupDraft } from './raid-run-form-schema';
import { draftSaveSchema, publishSchema } from './raid-run-form-schema';
import {
  applyReservedRoles,
  applySignupPatch,
  createInitialRaidRunDraft,
  findSignup,
  swapSignupsAt,
} from './raid-signup-draft';
import { isReservedTotalValid } from './role-slot-utils';
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
  const [selected, setSelected] = useState<{
    groupNumber: number;
    positionNumber: number;
  } | null>(null);

  const isPublished = status !== 'pending';
  const isDirty = JSON.stringify(draft) !== savedSnapshot;
  const canSave = !isPublished && isReservedTotalValid(draft);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isDirty && !isPublished) {
        event.preventDefault();
        event.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty, isPublished]);

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
      const parsed = draftSaveSchema.parse(draft);
      if (mode === 'create' && !raidRunId) {
        return raidRunsApi.create(parsed);
      }
      if (!raidRunId) {
        throw new Error('缺少草稿 ID');
      }
      return raidRunsApi.patch(raidRunId, parsed);
    },
    onSuccess: async (response) => {
      const nextDraft = toDraftFromResponse(response);
      setDraft(nextDraft);
      setSavedSnapshot(JSON.stringify(nextDraft));
      setStatus(response.status);
      toast.success('已暂存');

      if (mode === 'create') {
        await navigate({
          to: '/raids/create/$raidRunId',
          params: { raidRunId: response.id },
        });
      }
    },
    onError: (error) => handleError(error, '暂存失败'),
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      if (!raidRunId) {
        throw new Error('请先暂存');
      }

      publishSchema.parse(draft);

      if (isDirty) {
        const parsed = draftSaveSchema.parse(draft);
        await raidRunsApi.patch(raidRunId, parsed);
      }

      return raidRunsApi.publish(raidRunId);
    },
    onSuccess: (response) => {
      const nextDraft = toDraftFromResponse(response);
      setDraft(nextDraft);
      setSavedSnapshot(JSON.stringify(nextDraft));
      setStatus(response.status);
      toast.success('开团已发布');
    },
    onError: (error) => handleError(error, '发布失败'),
  });

  const updateDraft = (next: RaidRunDraft) => {
    setDraft(applyReservedRoles(next));
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
    setDraft({
      ...draft,
      signups: swapSignupsAt(draft.signups, from, to),
    });
    setSelected(to);
  };

  const publishDisabled = mode === 'create' || !raidRunId || isPublished;
  const publishHint =
    mode === 'create' ? '请先暂存后再发布' : isPublished ? '已发布' : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">我要开团</h1>
        <p className="text-sm text-muted-foreground">
          填写开团信息、布置 25 人团队，并预填部分团员。
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(280px,320px)_1fr_minmax(280px,320px)]">
        <section className="rounded-lg border p-4">
          <h2 className="mb-4 text-sm font-medium text-muted-foreground">
            开团信息
          </h2>
          <RaidRunFormComponent
            value={draft}
            disabled={isPublished}
            onChange={updateDraft}
          />
        </section>

        <section className="rounded-lg border p-4">
          <h2 className="mb-4 text-sm font-medium text-muted-foreground">
            团队布局
          </h2>
          <RaidGridComponent
            signups={draft.signups}
            selected={selected}
            disabled={isPublished}
            serverNameById={serverNameById}
            kungfuIconById={kungfuIconById}
            onSelect={(groupNumber, positionNumber) =>
              setSelected({ groupNumber, positionNumber })
            }
            onSwap={handleSwap}
          />
        </section>

        <section className="rounded-lg border p-4">
          <h2 className="mb-4 text-sm font-medium text-muted-foreground">
            团员属性
          </h2>
          <SignupPanelComponent
            signup={selectedSignup}
            disabled={isPublished}
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
          disabled={!canSave || saveMutation.isPending || isPublished}
          onClick={() => saveMutation.mutate()}
        >
          {saveMutation.isPending ? '暂存中…' : '暂存'}
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
        {isDirty && !isPublished ? (
          <span className="text-sm text-amber-600">有未保存的修改</span>
        ) : null}
      </div>
    </div>
  );
}
