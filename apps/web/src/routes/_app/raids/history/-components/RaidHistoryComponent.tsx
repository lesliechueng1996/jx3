import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { useMemo } from 'react';
import {
  type RaidHistoryFilter,
  raidRunsApi,
  raidRunsMineQueryKey,
} from '#/lib/api/raid-runs-api';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Route } from '../index';
import { RaidHistoryCardComponent } from './RaidHistoryCardComponent';
import {
  getEmptyStateMessage,
  groupRaidHistoryByWeek,
  RAID_HISTORY_FILTERS,
} from './raid-history-utils';

export function RaidHistoryComponent() {
  const { filter } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const historyQuery = useQuery({
    queryKey: [...raidRunsMineQueryKey, filter],
    queryFn: () => raidRunsApi.listMine(filter),
  });

  const setFilter = (nextFilter: RaidHistoryFilter) => {
    void navigate({
      search: { filter: nextFilter },
    });
  };

  const groupedItems = useMemo(() => {
    if (!historyQuery.data?.items.length) {
      return [];
    }

    return groupRaidHistoryByWeek(historyQuery.data.items);
  }, [historyQuery.data?.items]);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">参团记录</h1>
        <p className="text-sm text-muted-foreground">
          查看你参与或创建的团队，创建者可直接进入编辑。
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {RAID_HISTORY_FILTERS.map((option) => (
          <Button
            key={option.value}
            type="button"
            size="sm"
            variant={filter === option.value ? 'default' : 'outline'}
            className={cn('rounded-full')}
            onClick={() => setFilter(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>

      {historyQuery.isLoading ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {(['one', 'two', 'three', 'four'] as const).map((key) => (
            <div key={key} className="h-36 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : null}

      {historyQuery.isError ? (
        <div className="rounded-xl border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">加载失败，请稍后重试</p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="mt-4"
            onClick={() => historyQuery.refetch()}
          >
            重试
          </Button>
        </div>
      ) : null}

      {historyQuery.isSuccess && historyQuery.data.items.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <p className="text-sm text-muted-foreground">
            {getEmptyStateMessage(filter)}
          </p>
          {filter === 'created' ? (
            <Button asChild size="sm" className="mt-4">
              <Link to="/raids/create">前往我要开团</Link>
            </Button>
          ) : null}
        </div>
      ) : null}

      {historyQuery.isSuccess && historyQuery.data.items.length > 0 ? (
        <div className="flex flex-col gap-8">
          {groupedItems.map((group) => (
            <section key={group.weekStart.toISOString()} className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground">
                {group.label}
              </h2>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {group.items.map((item) => (
                  <RaidHistoryCardComponent
                    key={item.id}
                    item={item}
                    filter={filter}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : null}
    </div>
  );
}
