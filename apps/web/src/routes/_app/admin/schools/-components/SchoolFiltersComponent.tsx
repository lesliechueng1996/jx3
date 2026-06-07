import { type KeyboardEvent, useEffect, useState } from 'react';
import {
  SCHOOL_TYPE_LABELS,
  SCHOOL_TYPES,
  type SchoolType,
} from '#/lib/api/admin/schools-admin-api';
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
import type { SchoolsSearch } from './schools-search-schema';

type SchoolFiltersComponentProps = {
  committedFilters: SchoolsSearch;
  onSearch: (filters: SchoolsSearch) => void;
  onReset: () => void;
};

const ALL_VALUE = '__all__';

export function SchoolFiltersComponent({
  committedFilters,
  onSearch,
  onReset,
}: SchoolFiltersComponentProps) {
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
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="filter-school-name">门派名称</Label>
          <Input
            id="filter-school-name"
            value={draft.name ?? ''}
            placeholder="搜索门派名称"
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
                type: value === ALL_VALUE ? undefined : (value as SchoolType),
              }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="全部类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>全部类型</SelectItem>
              {SCHOOL_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {SCHOOL_TYPE_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="filter-school-alias">别称</Label>
          <Input
            id="filter-school-alias"
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
