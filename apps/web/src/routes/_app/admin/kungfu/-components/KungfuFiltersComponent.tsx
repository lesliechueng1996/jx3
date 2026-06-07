import { useQuery } from '@tanstack/react-query';
import { type KeyboardEvent, useEffect, useState } from 'react';
import {
  ATTACK_METHOD_LABELS,
  ATTACK_METHODS,
  ATTACK_TYPE_LABELS,
  ATTACK_TYPES,
  type AttackMethod,
  type AttackType,
  FORMATION_RECOMMEND_FILTER_LABELS,
  FORMATION_RECOMMEND_FILTERS,
  type FormationRecommendFilter,
  KUNGFU_TYPE_LABELS,
  KUNGFU_TYPES,
  type KungfuType,
} from '#/lib/api/admin/kungfu-admin-api';
import {
  schoolsAdminApi,
  schoolsAdminQueryKey,
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
import type { KungfuSearch } from './kungfu-search-schema';

type KungfuFiltersComponentProps = {
  committedFilters: KungfuSearch;
  onSearch: (filters: KungfuSearch) => void;
  onReset: () => void;
};

const ALL_VALUE = '__all__';

export function KungfuFiltersComponent({
  committedFilters,
  onSearch,
  onReset,
}: KungfuFiltersComponentProps) {
  const [draft, setDraft] = useState(committedFilters);

  const schoolsOptionsQuery = useQuery({
    queryKey: [...schoolsAdminQueryKey, 'options'],
    queryFn: () => schoolsAdminApi.listOptions(),
  });

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
          <Label htmlFor="filter-kungfu-name">心法名称</Label>
          <Input
            id="filter-kungfu-name"
            value={draft.name ?? ''}
            placeholder="搜索心法名称"
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
          <Label>所属门派</Label>
          <Select
            value={draft.schoolId ?? ALL_VALUE}
            onValueChange={(value) =>
              setDraft((current) => ({
                ...current,
                schoolId: value === ALL_VALUE ? undefined : value,
              }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="全部门派" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>全部门派</SelectItem>
              {(schoolsOptionsQuery.data?.items ?? []).map((school) => (
                <SelectItem key={school.id} value={school.id}>
                  {school.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>心法类型</Label>
          <Select
            value={draft.kungfuType ?? ALL_VALUE}
            onValueChange={(value) =>
              setDraft((current) => ({
                ...current,
                kungfuType:
                  value === ALL_VALUE ? undefined : (value as KungfuType),
              }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="全部类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>全部类型</SelectItem>
              {KUNGFU_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {KUNGFU_TYPE_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>攻击类型</Label>
          <Select
            value={draft.attackType ?? ALL_VALUE}
            onValueChange={(value) =>
              setDraft((current) => ({
                ...current,
                attackType:
                  value === ALL_VALUE ? undefined : (value as AttackType),
              }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="全部攻击类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>全部攻击类型</SelectItem>
              {ATTACK_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {ATTACK_TYPE_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>攻击方式</Label>
          <Select
            value={draft.attackMethod ?? ALL_VALUE}
            onValueChange={(value) =>
              setDraft((current) => ({
                ...current,
                attackMethod:
                  value === ALL_VALUE ? undefined : (value as AttackMethod),
              }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="全部攻击方式" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>全部攻击方式</SelectItem>
              {ATTACK_METHODS.map((method) => (
                <SelectItem key={method} value={method}>
                  {ATTACK_METHOD_LABELS[method]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>是否阵眼</Label>
          <Select
            value={draft.formationRecommend ?? ALL_VALUE}
            onValueChange={(value) =>
              setDraft((current) => ({
                ...current,
                formationRecommend:
                  value === ALL_VALUE
                    ? undefined
                    : (value as FormationRecommendFilter),
              }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="全部" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>全部</SelectItem>
              {FORMATION_RECOMMEND_FILTERS.map((filter) => (
                <SelectItem key={filter} value={filter}>
                  {FORMATION_RECOMMEND_FILTER_LABELS[filter]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>是否无界</Label>
          <Select
            value={
              draft.isUnlimited === undefined
                ? ALL_VALUE
                : String(draft.isUnlimited)
            }
            onValueChange={(value) =>
              setDraft((current) => ({
                ...current,
                isUnlimited: value === ALL_VALUE ? undefined : value === 'true',
              }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="全部" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>全部</SelectItem>
              <SelectItem value="true">是</SelectItem>
              <SelectItem value="false">否</SelectItem>
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
