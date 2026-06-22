import type {
  RaidHistoryFilter,
  RaidRunListItem,
} from '#/lib/api/raid-runs-api';

export const RAID_HISTORY_FILTERS: Array<{
  value: RaidHistoryFilter;
  label: string;
}> = [
  { value: 'all', label: '全部' },
  { value: 'created', label: '我创建的' },
  { value: 'leader', label: '我是团长' },
];

export const RAID_RUN_STATUS_LABELS: Record<RaidRunListItem['status'], string> =
  {
    pending: '草稿',
    recruiting: '招募中',
    ongoing: '进行中',
    completed: '已完成',
    cancelled: '已取消',
  };

export const RAID_SIGNUP_ROLE_LABELS: Record<
  NonNullable<RaidRunListItem['mySignup']>['role'],
  string | null
> = {
  pending: null,
  tank: '坦克',
  healer: '治疗',
  dps: 'DPS',
  boss: '老板',
};

export const getRaidRunStatusBorderClass = (
  status: RaidRunListItem['status'],
): string => {
  switch (status) {
    case 'recruiting':
      return 'border-l-chart-2';
    case 'ongoing':
      return 'border-l-primary';
    case 'completed':
      return 'border-l-muted-foreground/40';
    case 'cancelled':
      return 'border-l-destructive/40';
    default:
      return 'border-l-muted-foreground/30';
  }
};

export const formatRaidSchedule = (
  startTime: string | null,
  gatherTime: string | null,
): { primary: string; secondary: string | null } => {
  if (!startTime) {
    return { primary: '时间待定', secondary: null };
  }

  const start = new Date(startTime);
  const primary = new Intl.DateTimeFormat('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
  }).format(start);
  const secondary = new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(start);

  if (!gatherTime) {
    return { primary, secondary: `进本 ${secondary}` };
  }

  const gather = new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(gatherTime));

  return {
    primary,
    secondary: `集合 ${gather} · 进本 ${secondary}`,
  };
};

export const getEmptyStateMessage = (filter: RaidHistoryFilter): string => {
  switch (filter) {
    case 'created':
      return '还没有创建过团队';
    case 'leader':
      return '暂无担任团长的记录';
    default:
      return '暂无参团记录';
  }
};

const getWeekStart = (date: Date): Date => {
  const weekStart = new Date(date);
  const weekday = weekStart.getDay();
  const diff = weekday === 0 ? -6 : 1 - weekday;
  weekStart.setDate(weekStart.getDate() + diff);
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
};

const getWeekEnd = (weekStart: Date): Date => {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  return weekEnd;
};

export const getRaidHistorySortTime = (item: RaidRunListItem): number => {
  const time = item.startTime ?? item.gatherTime ?? item.createdAt;
  return new Date(time).getTime();
};

export const formatWeekGroupLabel = (
  weekStart: Date,
  now: Date = new Date(),
): string => {
  const thisWeekStart = getWeekStart(now);
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);

  if (weekStart.getTime() === thisWeekStart.getTime()) {
    return '本周';
  }

  if (weekStart.getTime() === lastWeekStart.getTime()) {
    return '上周';
  }

  const weekEnd = getWeekEnd(weekStart);
  const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
    month: 'numeric',
    day: 'numeric',
  });
  const startLabel = dateFormatter.format(weekStart);
  const endLabel = dateFormatter.format(weekEnd);

  if (weekStart.getFullYear() !== now.getFullYear()) {
    return `${weekStart.getFullYear()}年${startLabel} - ${endLabel}`;
  }

  return `${startLabel} - ${endLabel}`;
};

export type RaidHistoryWeekGroup = {
  weekStart: Date;
  label: string;
  items: RaidRunListItem[];
};

export const groupRaidHistoryByWeek = (
  items: RaidRunListItem[],
  now: Date = new Date(),
): RaidHistoryWeekGroup[] => {
  const groups = new Map<
    string,
    { weekStart: Date; items: RaidRunListItem[] }
  >();

  for (const item of items) {
    const weekStart = getWeekStart(new Date(getRaidHistorySortTime(item)));
    const key = weekStart.toISOString();
    const existing = groups.get(key);

    if (existing) {
      existing.items.push(item);
      continue;
    }

    groups.set(key, { weekStart, items: [item] });
  }

  return [...groups.values()]
    .sort((left, right) => right.weekStart.getTime() - left.weekStart.getTime())
    .map((group) => ({
      ...group,
      label: formatWeekGroupLabel(group.weekStart, now),
    }));
};

export type RaidRunStatusAction = {
  target: RaidRunListItem['status'];
  label: string;
  destructive?: boolean;
  confirmMessage?: string;
};

export const getRaidRunStatusActions = (
  status: RaidRunListItem['status'],
): RaidRunStatusAction[] => {
  switch (status) {
    case 'pending':
      return [
        { target: 'recruiting', label: '发布招募' },
        {
          target: 'cancelled',
          label: '取消团队',
          destructive: true,
          confirmMessage: '确定要取消这个团队吗？取消后无法恢复。',
        },
      ];
    case 'recruiting':
      return [
        { target: 'ongoing', label: '开始团本' },
        {
          target: 'cancelled',
          label: '取消团队',
          destructive: true,
          confirmMessage: '确定要取消这个团队吗？取消后无法恢复。',
        },
      ];
    case 'ongoing':
      return [
        { target: 'completed', label: '标记完成' },
        {
          target: 'cancelled',
          label: '取消团队',
          destructive: true,
          confirmMessage: '确定要取消这个团队吗？取消后无法恢复。',
        },
      ];
    default:
      return [];
  }
};
