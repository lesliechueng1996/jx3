import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { AdminSchoolListItem } from '#/lib/api/admin/schools-admin-api';
import {
  type ListSchoolsFilters,
  schoolsAdminApi,
  schoolsAdminQueryKey,
} from '#/lib/api/admin/schools-admin-api';
import { ApiRequestError } from '#/lib/api/request';
import { Button } from '@/components/ui/button';
import { SchoolFiltersComponent } from './SchoolFiltersComponent';
import { SchoolFormDialogComponent } from './SchoolFormDialogComponent';
import { SchoolTableComponent } from './SchoolTableComponent';

const DEFAULT_FILTERS: ListSchoolsFilters = {
  page: 1,
  pageSize: 20,
};

export function SchoolManagementComponent() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<ListSchoolsFilters>(DEFAULT_FILTERS);
  const [editingSchool, setEditingSchool] =
    useState<AdminSchoolListItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [pendingSchoolId, setPendingSchoolId] = useState<string | null>(null);

  const schoolsQuery = useQuery({
    queryKey: [...schoolsAdminQueryKey, filters],
    queryFn: () => schoolsAdminApi.list(filters),
  });

  const invalidateSchools = async () => {
    await queryClient.invalidateQueries({ queryKey: schoolsAdminQueryKey });
  };

  const handleError = (error: unknown, fallbackMessage: string) => {
    if (error instanceof ApiRequestError) {
      toast.error(error.message);
      return;
    }
    toast.error(fallbackMessage);
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
        filters={filters}
        onChange={setFilters}
        onCreate={() => setCreating(true)}
      />

      {schoolsQuery.isError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          加载门派列表失败，请稍后重试。
        </div>
      ) : null}

      <SchoolTableComponent
        items={schoolsQuery.data?.items ?? []}
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
            onClick={() =>
              setFilters((current) => ({ ...current, page: current.page - 1 }))
            }
          >
            上一页
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={filters.page >= totalPages || schoolsQuery.isFetching}
            onClick={() =>
              setFilters((current) => ({ ...current, page: current.page + 1 }))
            }
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
