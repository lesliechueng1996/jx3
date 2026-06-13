import { useQuery } from '@tanstack/react-query';
import { type KeyboardEvent, useEffect, useMemo, useState } from 'react';
import {
  DUNGEON_DIFFICULTIES,
  DUNGEON_DIFFICULTY_LABELS,
  type DungeonDifficulty,
} from '#/lib/api/admin/dungeons-admin-api';
import {
  expansionsAdminApi,
  expansionsAdminQueryKey,
} from '#/lib/api/admin/expansions-admin-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { DungeonSearch } from './dungeon-search-schema';

type DungeonFiltersComponentProps = {
  committedFilters: DungeonSearch;
  onSearch: (filters: DungeonSearch) => void;
  onReset: () => void;
};

const ALL_VALUE = '__all__';

export function DungeonFiltersComponent({
  committedFilters,
  onSearch,
  onReset,
}: DungeonFiltersComponentProps) {
  const [draft, setDraft] = useState(committedFilters);

  const filterOptionsQuery = useQuery({
    queryKey: [...expansionsAdminQueryKey, 'filter-options'],
    queryFn: () => expansionsAdminApi.listFilterOptions(),
  });

  const expansionOptions = filterOptionsQuery.data?.items ?? [];

  const seasonOptions = useMemo(() => {
    if (!draft.expansionId) {
      return expansionOptions.flatMap((expansion) => expansion.seasons);
    }

    return (
      expansionOptions.find((expansion) => expansion.id === draft.expansionId)
        ?.seasons ?? []
    );
  }, [draft.expansionId, expansionOptions]);

  useEffect(() => {
    setDraft(committedFilters);
  }, [committedFilters]);

  const handleSearch = () => {
    onSearch({ ...draft, page: 1 });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSearch();
    }
  };

  return (
    <div className="space-y-4 rounded-lg border border-border p-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="filter-dungeon-name">副本名称</Label>
          <Input
            id="filter-dungeon-name"
            value={draft.name ?? ''}
            placeholder="搜索副本名称"
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                name: event.target.value || undefined,
              }))
            }
            onKeyDown={handleKeyDown}
          />
        </div>
        <div className="space-y-2">
          <Label>资料片</Label>
          <Select
            value={draft.expansionId ?? ALL_VALUE}
            onValueChange={(value) =>
              setDraft((current) => ({
                ...current,
                expansionId: value === ALL_VALUE ? undefined : value,
                seasonId: undefined,
              }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="全部资料片" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>全部资料片</SelectItem>
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
            value={draft.seasonId ?? ALL_VALUE}
            onValueChange={(value) =>
              setDraft((current) => ({
                ...current,
                seasonId: value === ALL_VALUE ? undefined : value,
              }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="全部赛季" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>全部赛季</SelectItem>
              {seasonOptions.map((season) => (
                <SelectItem key={season.id} value={season.id}>
                  {season.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>副本难度</Label>
          <Select
            value={draft.difficulty ?? ALL_VALUE}
            onValueChange={(value) =>
              setDraft((current) => ({
                ...current,
                difficulty:
                  value === ALL_VALUE
                    ? undefined
                    : (value as DungeonDifficulty),
              }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="全部难度" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>全部难度</SelectItem>
              {DUNGEON_DIFFICULTIES.map((difficulty) => (
                <SelectItem key={difficulty} value={difficulty}>
                  {DUNGEON_DIFFICULTY_LABELS[difficulty]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button type="button" onClick={handleSearch}>
          搜索
        </Button>
        <Button type="button" variant="outline" onClick={onReset}>
          重置
        </Button>
      </div>
    </div>
  );
}
