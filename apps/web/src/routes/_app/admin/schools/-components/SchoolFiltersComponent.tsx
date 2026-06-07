import type { ListSchoolsFilters } from '#/lib/api/admin/schools-admin-api';
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

type SchoolFiltersComponentProps = {
  filters: ListSchoolsFilters;
  onChange: (filters: ListSchoolsFilters) => void;
  onCreate: () => void;
};

const ALL_VALUE = '__all__';

export function SchoolFiltersComponent({
  filters,
  onChange,
  onCreate,
}: SchoolFiltersComponentProps) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border p-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="grid flex-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="filter-school-name">门派名称</Label>
          <Input
            id="filter-school-name"
            value={filters.name ?? ''}
            placeholder="搜索门派名称"
            onChange={(event) =>
              onChange({
                ...filters,
                page: 1,
                name: event.target.value || undefined,
              })
            }
          />
        </div>
        <div className="space-y-2">
          <Label>类型</Label>
          <Select
            value={filters.type ?? ALL_VALUE}
            onValueChange={(value) =>
              onChange({
                ...filters,
                page: 1,
                type: value === ALL_VALUE ? undefined : (value as SchoolType),
              })
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
            value={filters.alias ?? ''}
            placeholder="搜索别称"
            onChange={(event) =>
              onChange({
                ...filters,
                page: 1,
                alias: event.target.value || undefined,
              })
            }
          />
        </div>
      </div>
      <Button type="button" onClick={onCreate}>
        新建门派
      </Button>
    </div>
  );
}
