import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import type { AdminDungeonListItem } from '#/lib/api/admin/dungeons-admin-api';
import {
  gameReferenceApi,
  gameReferenceQueryKey,
} from '#/lib/api/game-reference-api';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { RaidRunDraft } from './raid-run-form-schema';
import { applyDungeonSelection, applyReservedRoles } from './raid-signup-draft';
import {
  DEFAULT_PLAYER_LIMIT,
  getReservedTotal,
  isReservedTotalValid,
} from './role-slot-utils';

type RaidRunFormComponentProps = {
  value: RaidRunDraft;
  disabled?: boolean;
  onChange: (next: RaidRunDraft) => void;
  dungeonPlayerLimit?: number | null;
};

const toDateTimeLocal = (iso: string | null): string => {
  if (!iso) {
    return '';
  }

  const date = new Date(iso);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
};

const fromDateTimeLocal = (value: string): string | null => {
  if (!value) {
    return null;
  }

  return new Date(value).toISOString();
};

const parseReservedInput = (value: string): number => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }
  return parsed;
};

export function RaidRunFormComponent({
  value,
  disabled = false,
  onChange,
  dungeonPlayerLimit = null,
}: RaidRunFormComponentProps) {
  const [dungeonSearch, setDungeonSearch] = useState('');
  const [selectedDungeon, setSelectedDungeon] =
    useState<AdminDungeonListItem | null>(null);
  const [showDungeonResults, setShowDungeonResults] = useState(false);

  const dungeonsQuery = useQuery({
    queryKey: [...gameReferenceQueryKey, 'dungeons', dungeonSearch],
    queryFn: () => gameReferenceApi.searchDungeons(dungeonSearch),
    enabled: showDungeonResults,
  });

  useEffect(() => {
    if (!value.dungeonId) {
      setSelectedDungeon(null);
      return;
    }

    if (selectedDungeon?.id === value.dungeonId) {
      return;
    }

    void gameReferenceApi.searchDungeons('').then((response) => {
      const match = response.items.find((item) => item.id === value.dungeonId);
      if (match) {
        setSelectedDungeon(match);
        setDungeonSearch(match.name);
      }
    });
  }, [selectedDungeon?.id, value.dungeonId]);

  const playerLimit =
    dungeonPlayerLimit ?? selectedDungeon?.playerLimit ?? DEFAULT_PLAYER_LIMIT;

  const resolvePlayerLimitForRoleApply = (): number | null => {
    if (dungeonPlayerLimit != null) {
      return dungeonPlayerLimit;
    }
    if (selectedDungeon != null) {
      return selectedDungeon.playerLimit;
    }
    return null;
  };

  const reservedTotal = useMemo(() => getReservedTotal(value), [value]);
  const reservedInvalid = !isReservedTotalValid(value, playerLimit);

  const updateField = <K extends keyof RaidRunDraft>(
    key: K,
    fieldValue: RaidRunDraft[K],
  ) => {
    onChange({ ...value, [key]: fieldValue });
  };

  const selectDungeon = (dungeon: AdminDungeonListItem) => {
    setSelectedDungeon(dungeon);
    setDungeonSearch(dungeon.name);
    setShowDungeonResults(false);
    onChange(
      applyDungeonSelection(
        { ...value, dungeonId: dungeon.id },
        dungeon.playerLimit,
      ),
    );
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="raid-name">团队名称</Label>
        <Input
          id="raid-name"
          disabled={disabled}
          value={value.name}
          onChange={(event) => updateField('name', event.target.value)}
          placeholder="例如：周末英雄雷域"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="raid-description">描述</Label>
        <Textarea
          id="raid-description"
          disabled={disabled}
          value={value.description ?? ''}
          onChange={(event) =>
            updateField('description', event.target.value || null)
          }
          placeholder="补充开团说明"
          rows={3}
        />
      </div>

      <div className="relative space-y-2">
        <Label htmlFor="raid-dungeon">副本</Label>
        <Input
          id="raid-dungeon"
          disabled={disabled}
          value={dungeonSearch}
          onChange={(event) => {
            setDungeonSearch(event.target.value);
            setShowDungeonResults(true);
          }}
          onFocus={() => setShowDungeonResults(true)}
          onBlur={() => {
            window.setTimeout(() => setShowDungeonResults(false), 150);
          }}
          placeholder="搜索副本名称"
        />
        {showDungeonResults && (
          <div className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-md border bg-popover shadow-md">
            {dungeonsQuery.isLoading ? (
              <p className="px-3 py-2 text-sm text-muted-foreground">搜索中…</p>
            ) : dungeonsQuery.data?.items.length ? (
              dungeonsQuery.data.items.map((dungeon) => (
                <button
                  key={dungeon.id}
                  type="button"
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-muted"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectDungeon(dungeon)}
                >
                  <span className="font-medium">{dungeon.name}</span>
                  <span className="ml-2 text-muted-foreground">
                    {dungeon.expansionName} · {dungeon.seasonName} ·{' '}
                    {dungeon.playerLimit} 人
                  </span>
                </button>
              ))
            ) : (
              <p className="px-3 py-2 text-sm text-muted-foreground">
                未找到副本
              </p>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-3">
        <div className="space-y-2">
          <Label htmlFor="raid-gather-time">集合时间</Label>
          <Input
            id="raid-gather-time"
            type="datetime-local"
            disabled={disabled}
            value={toDateTimeLocal(value.gatherTime)}
            onChange={(event) =>
              updateField('gatherTime', fromDateTimeLocal(event.target.value))
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="raid-start-time">进本时间</Label>
          <Input
            id="raid-start-time"
            type="datetime-local"
            disabled={disabled}
            value={toDateTimeLocal(value.startTime)}
            onChange={(event) =>
              updateField('startTime', fromDateTimeLocal(event.target.value))
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="raid-end-time">预计结束时间</Label>
          <Input
            id="raid-end-time"
            type="datetime-local"
            disabled={disabled}
            value={toDateTimeLocal(value.endTime)}
            onChange={(event) =>
              updateField('endTime', fromDateTimeLocal(event.target.value))
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {(
          [
            ['reservedTank', '坦克'],
            ['reservedHealer', '治疗'],
            ['reservedDps', 'DPS'],
            ['reservedBoss', '老板'],
          ] as const
        ).map(([key, label]) => (
          <div key={key} className="space-y-2">
            <Label htmlFor={`raid-${key}`}>{label}预留</Label>
            <Input
              id={`raid-${key}`}
              type="number"
              min={0}
              max={playerLimit}
              disabled={disabled}
              value={String(value[key])}
              onChange={(event) => {
                const next = {
                  ...value,
                  [key]: parseReservedInput(event.target.value),
                };
                const roleApplyLimit = resolvePlayerLimitForRoleApply();
                onChange(
                  roleApplyLimit == null
                    ? next
                    : applyReservedRoles(next, roleApplyLimit),
                );
              }}
            />
          </div>
        ))}
      </div>

      <p
        className={cn(
          'text-sm',
          reservedInvalid ? 'text-destructive' : 'text-muted-foreground',
        )}
      >
        预留合计：{reservedTotal} / {playerLimit}
        {reservedInvalid ? '（超出上限，请调整）' : ''}
      </p>

      <div className="space-y-2">
        <Label htmlFor="raid-remark">备注</Label>
        <Textarea
          id="raid-remark"
          disabled={disabled}
          value={value.remark ?? ''}
          onChange={(event) =>
            updateField('remark', event.target.value || null)
          }
          rows={2}
        />
      </div>
    </div>
  );
}
