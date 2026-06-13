import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import {
  type AdminDungeonListItem,
  DUNGEON_DIFFICULTIES,
  DUNGEON_DIFFICULTY_LABELS,
  type DungeonDifficulty,
  type DungeonFormValues,
  RESET_WEEKDAY_LABELS,
  RESET_WEEKDAYS,
} from '#/lib/api/admin/dungeons-admin-api';
import {
  expansionsAdminApi,
  expansionsAdminQueryKey,
} from '#/lib/api/admin/expansions-admin-api';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

type DungeonFormDialogComponentProps = {
  dungeon: AdminDungeonListItem | null;
  mode: 'create' | 'edit';
  open: boolean;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: DungeonFormValues) => void;
};

const NONE_VALUE = '__none__';

const emptyForm = (): DungeonFormValues => ({
  name: '',
  expansionId: '',
  seasonId: '',
  playerLimit: 25,
  difficulty: 'normal',
  levelRequirement: 1,
  bossCount: 1,
  resetWeekdays: [],
});

export function DungeonFormDialogComponent({
  dungeon,
  mode,
  open,
  pending,
  onOpenChange,
  onSubmit,
}: DungeonFormDialogComponentProps) {
  const [form, setForm] = useState<DungeonFormValues>(emptyForm);
  const [playerLimitInput, setPlayerLimitInput] = useState('25');
  const [levelRequirementInput, setLevelRequirementInput] = useState('1');
  const [bossCountInput, setBossCountInput] = useState('1');

  const filterOptionsQuery = useQuery({
    queryKey: [...expansionsAdminQueryKey, 'filter-options'],
    queryFn: () => expansionsAdminApi.listFilterOptions(),
    enabled: open,
  });

  const expansionOptions = filterOptionsQuery.data?.items ?? [];

  const seasonOptions = useMemo(() => {
    if (!form.expansionId) {
      return [];
    }

    return (
      expansionOptions.find((expansion) => expansion.id === form.expansionId)
        ?.seasons ?? []
    );
  }, [expansionOptions, form.expansionId]);

  useEffect(() => {
    if (mode === 'edit' && dungeon) {
      setForm({
        name: dungeon.name,
        expansionId: dungeon.expansionId,
        seasonId: dungeon.seasonId,
        playerLimit: dungeon.playerLimit,
        difficulty: dungeon.difficulty,
        levelRequirement: dungeon.levelRequirement,
        bossCount: dungeon.bossCount,
        resetWeekdays: dungeon.resetWeekdays,
      });
      setPlayerLimitInput(String(dungeon.playerLimit));
      setLevelRequirementInput(String(dungeon.levelRequirement));
      setBossCountInput(String(dungeon.bossCount));
      return;
    }

    if (mode === 'create') {
      setForm(emptyForm());
      setPlayerLimitInput('25');
      setLevelRequirementInput('1');
      setBossCountInput('1');
    }
  }, [dungeon, mode]);

  const toggleResetWeekday = (weekday: number) => {
    setForm((current) => {
      const exists = current.resetWeekdays.includes(weekday);
      const resetWeekdays = exists
        ? current.resetWeekdays.filter((day) => day !== weekday)
        : [...current.resetWeekdays, weekday].sort((a, b) => a - b);

      return { ...current, resetWeekdays };
    });
  };

  const handleSubmit = () => {
    const playerLimit = Number.parseInt(playerLimitInput, 10);
    const levelRequirement = Number.parseInt(levelRequirementInput, 10);
    const bossCount = Number.parseInt(bossCountInput, 10);

    if (
      !form.name.trim() ||
      !form.expansionId ||
      !form.seasonId ||
      !Number.isFinite(playerLimit) ||
      playerLimit < 1 ||
      !Number.isFinite(levelRequirement) ||
      levelRequirement < 1 ||
      !Number.isFinite(bossCount) ||
      bossCount < 1
    ) {
      return;
    }

    onSubmit({
      ...form,
      name: form.name.trim(),
      playerLimit,
      levelRequirement,
      bossCount,
    });
  };

  const isValid =
    form.name.trim().length > 0 &&
    form.expansionId.length > 0 &&
    form.seasonId.length > 0 &&
    Number.parseInt(playerLimitInput, 10) >= 1 &&
    Number.parseInt(levelRequirementInput, 10) >= 1 &&
    Number.parseInt(bossCountInput, 10) >= 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? '新建副本' : '编辑副本'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? '填写副本基础信息并保存。'
              : '修改副本信息后保存。'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="dungeon-name">副本名称</Label>
            <Input
              id="dungeon-name"
              value={form.name}
              placeholder="请输入副本名称"
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label>资料片</Label>
            <Select
              value={form.expansionId || NONE_VALUE}
              onValueChange={(value) =>
                setForm((current) => ({
                  ...current,
                  expansionId: value,
                  seasonId: '',
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="选择资料片" />
              </SelectTrigger>
              <SelectContent>
                {expansionOptions.map((expansion) => (
                  <SelectItem key={expansion.id} value={expansion.id}>
                    {expansion.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>赛季</Label>
            <Select
              value={form.seasonId || NONE_VALUE}
              disabled={!form.expansionId}
              onValueChange={(value) =>
                setForm((current) => ({ ...current, seasonId: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="选择赛季" />
              </SelectTrigger>
              <SelectContent>
                {seasonOptions.map((season) => (
                  <SelectItem key={season.id} value={season.id}>
                    {season.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dungeon-player-limit">玩家数</Label>
              <Input
                id="dungeon-player-limit"
                type="number"
                min={1}
                value={playerLimitInput}
                onChange={(event) => setPlayerLimitInput(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>副本难度</Label>
              <Select
                value={form.difficulty}
                onValueChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    difficulty: value as DungeonDifficulty,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DUNGEON_DIFFICULTIES.map((difficulty) => (
                    <SelectItem key={difficulty} value={difficulty}>
                      {DUNGEON_DIFFICULTY_LABELS[difficulty]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dungeon-level-requirement">等级要求</Label>
              <Input
                id="dungeon-level-requirement"
                type="number"
                min={1}
                value={levelRequirementInput}
                onChange={(event) =>
                  setLevelRequirementInput(event.target.value)
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dungeon-boss-count">Boss 数量</Label>
              <Input
                id="dungeon-boss-count"
                type="number"
                min={1}
                value={bossCountInput}
                onChange={(event) => setBossCountInput(event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>CD 刷新日</Label>
            <p className="text-xs text-muted-foreground">
              不选择表示无每周 CD。
            </p>
            <div className="flex flex-wrap gap-2">
              {RESET_WEEKDAYS.map((weekday) => {
                const selected = form.resetWeekdays.includes(weekday);
                return (
                  <Button
                    key={weekday}
                    type="button"
                    size="sm"
                    variant={selected ? 'default' : 'outline'}
                    className={cn(selected ? '' : 'text-muted-foreground')}
                    onClick={() => toggleResetWeekday(weekday)}
                  >
                    {RESET_WEEKDAY_LABELS[weekday]}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => onOpenChange(false)}
          >
            取消
          </Button>
          <Button
            type="button"
            disabled={!isValid || pending}
            onClick={handleSubmit}
          >
            {pending ? '保存中…' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
