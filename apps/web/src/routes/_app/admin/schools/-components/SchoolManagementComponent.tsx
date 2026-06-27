import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getRouteApi } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { AdminSchoolListItem } from '#/lib/api/admin/schools-admin-api';
import {
  schoolsAdminApi,
  schoolsAdminQueryKey,
} from '#/lib/api/admin/schools-admin-api';
import { showMutationErrorToast } from '#/lib/utils/mutation-error';
import { toRouteSearch } from '#/routes/_app/admin/-components/admin-list-search';
import { Button } from '@/components/ui/button';
import { SchoolFiltersComponent } from './SchoolFiltersComponent';
import { SchoolFormDialogComponent } from './SchoolFormDialogComponent';
import { SchoolTableComponent } from './SchoolTableComponent';
import {
  DEFAULT_SCHOOLS_SEARCH,
  type SchoolsSearch,
} from './schools-search-schema';

const schoolsRouteApi = getRouteApi('/_app/admin/schools/');

export function SchoolManagementComponent() {
  const navigate = schoolsRouteApi.useNavigate();
  const filters = schoolsRouteApi.useSearch();
  const queryClient = useQueryClient();
  const [editingSchool, setEditingSchool] =
    useState<AdminSchoolListItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [pendingSchoolId, setPendingSchoolId] = useState<string | null>(null);

  const updateSearch = (nextFilters: SchoolsSearch) => {
    navigate({
      to: '.',
      search: toRouteSearch(nextFilters, DEFAULT_SCHOOLS_SEARCH),
    });
  };

  const schoolsQuery = useQuery({
    queryKey: [...schoolsAdminQueryKey, filters],
    queryFn: () => schoolsAdminApi.list(filters),
  });

  const invalidateSchools = async () => {
    await queryClient.invalidateQueries({ queryKey: schoolsAdminQueryKey });
  };

  const handleError = (error: unknown, fallbackMessage: string) => {
    showMutationErrorToast(error, fallbackMessage);
  };

  const createMutation = useMutation({
    mutationFn: schoolsAdminApi.create,
    onSuccess: async () => {
      toast.success('门派已创建');
      setCreating(false);
      await invalidateSchools();
    },
    onError: (error) => handleError(error, '创建门派失败'),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      schoolId,
      ...body
    }: {
      schoolId: string;
      name: string;
      type: AdminSchoolListItem['type'];
      icon: string | null;
      alias: string[];
    }) => schoolsAdminApi.update(schoolId, body),
    onSuccess: async () => {
      toast.success('门派信息已更新');
      setEditingSchool(null);
      await invalidateSchools();
    },
    onError: (error) => handleError(error, '更新门派失败'),
  });

  const deleteMutation = useMutation({
    mutationFn: (schoolId: string) => schoolsAdminApi.delete(schoolId),
    onSuccess: async () => {
      toast.success('门派已删除');
      await invalidateSchools();
    },
    onError: (error) => handleError(error, '删除门派失败'),
    onSettled: () => setPendingSchoolId(null),
  });

  const totalPages = useMemo(() => {
    const total = schoolsQuery.data?.total ?? 0;
    return Math.max(1, Math.ceil(total / filters.pageSize));
  }, [filters.pageSize, schoolsQuery.data?.total]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">门派管理</h1>
        <p className="text-sm text-muted-foreground">
          管理游戏门派与流派信息，仅超级管理员可访问。
        </p>
      </div>

      <SchoolFiltersComponent
        committedFilters={filters}
        onSearch={updateSearch}
        onReset={() => updateSearch(DEFAULT_SCHOOLS_SEARCH)}
      />

      <div className="flex justify-end">
        <Button type="button" onClick={() => setCreating(true)}>
          新建门派
        </Button>
      </div>

      {schoolsQuery.isError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          加载门派列表失败，请稍后重试。
        </div>
      ) : null}

      <SchoolTableComponent
        items={schoolsQuery.data?.items ?? []}
        isLoading={schoolsQuery.isFetching}
        pendingSchoolId={pendingSchoolId}
        onEdit={setEditingSchool}
        onDelete={(school) => {
          if (!window.confirm(`确定删除门派 ${school.name} 吗？`)) {
            return;
          }
          setPendingSchoolId(school.id);
          deleteMutation.mutate(school.id);
        }}
      />

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          共 {schoolsQuery.data?.total ?? 0} 条，第 {filters.page} /{' '}
          {totalPages} 页
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={filters.page <= 1 || schoolsQuery.isFetching}
            onClick={() => updateSearch({ ...filters, page: filters.page - 1 })}
          >
            上一页
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={filters.page >= totalPages || schoolsQuery.isFetching}
            onClick={() => updateSearch({ ...filters, page: filters.page + 1 })}
          >
            下一页
          </Button>
        </div>
      </div>

      <SchoolFormDialogComponent
        mode="create"
        school={null}
        open={creating}
        pending={createMutation.isPending}
        onOpenChange={setCreating}
        onSubmit={(values) => createMutation.mutate(values)}
      />

      <SchoolFormDialogComponent
        mode="edit"
        school={editingSchool}
        open={editingSchool !== null}
        pending={updateMutation.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setEditingSchool(null);
          }
        }}
        onSubmit={(values) => {
          if (!editingSchool) {
            return;
          }
          updateMutation.mutate({
            schoolId: editingSchool.id,
            ...values,
          });
        }}
      />
    </div>
  );
}
