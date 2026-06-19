import { type KeyboardEvent, useEffect, useState } from 'react';
import {
  ITEM_QUALITIES,
  ITEM_QUALITY_LABELS,
  ITEM_TYPE_LABELS,
  ITEM_TYPES,
  type ItemQuality,
  type ItemType,
} from '#/lib/api/admin/game-items-admin-api';
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
import type { ItemSearch } from './item-search-schema';

type ItemFiltersComponentProps = {
  committedFilters: ItemSearch;
  onSearch: (filters: ItemSearch) => void;
  onReset: () => void;
};

const ALL_VALUE = '__all__';

export function ItemFiltersComponent({
  committedFilters,
  onSearch,
  onReset,
}: ItemFiltersComponentProps) {
  const [draft, setDraft] = useState(committedFilters);

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
          <Label htmlFor="filter-item-name">物品名称</Label>
          <Input
            id="filter-item-name"
            value={draft.name ?? ''}
            placeholder="搜索物品名称"
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
          <Label>类型</Label>
          <Select
            value={draft.type ?? ALL_VALUE}
            onValueChange={(value) =>
              setDraft((current) => ({
                ...current,
                type: value === ALL_VALUE ? undefined : (value as ItemType),
              }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="全部类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>全部类型</SelectItem>
              {ITEM_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {ITEM_TYPE_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>品质</Label>
          <Select
            value={draft.quality ?? ALL_VALUE}
            onValueChange={(value) =>
              setDraft((current) => ({
                ...current,
                quality:
                  value === ALL_VALUE ? undefined : (value as ItemQuality),
              }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="全部品质" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>全部品质</SelectItem>
              {ITEM_QUALITIES.map((quality) => (
                <SelectItem key={quality} value={quality}>
                  {ITEM_QUALITY_LABELS[quality]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="filter-item-alias">别称</Label>
          <Input
            id="filter-item-alias"
            value={draft.alias ?? ''}
            placeholder="搜索别称"
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                alias: event.target.value || undefined,
              }))
            }
            onKeyDown={handleKeyDown}
          />
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
