import { Link } from '@tanstack/react-router';
import { ChevronRight } from 'lucide-react';
import type {
  RaidHistoryFilter,
  RaidRunListItem,
} from '#/lib/api/raid-runs-api';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { RaidHistoryStatusMenuComponent } from './RaidHistoryStatusMenuComponent';
import {
  formatRaidSchedule,
  getRaidRunStatusBorderClass,
  RAID_SIGNUP_ROLE_LABELS,
} from './raid-history-utils';

type RaidHistoryCardComponentProps = {
  item: RaidRunListItem;
  filter: RaidHistoryFilter;
};

export function RaidHistoryCardComponent({
  item,
  filter,
}: RaidHistoryCardComponentProps) {
  const title = item.dungeonName ?? '未选择副本';
  const roleLabel = item.mySignup
    ? RAID_SIGNUP_ROLE_LABELS[item.mySignup.role]
    : null;
  const characterLine =
    item.mySignup?.characterName && item.mySignup.serverName
      ? `${item.mySignup.characterName} · ${item.mySignup.serverName}`
      : item.mySignup?.characterName;
  const schedule = formatRaidSchedule(item.startTime, item.gatherTime);

  const card = (
    <Card
      className={cn(
        'border-l-4 py-4 shadow-xs transition-colors',
        getRaidRunStatusBorderClass(item.status),
        item.isCreator && 'hover:bg-muted/40',
      )}
      size="sm"
    >
      <CardContent className="flex items-stretch gap-4">
        {item.isCreator ? (
          <Link
            to="/raids/create/$raidRunId"
            params={{ raidRunId: item.id }}
            className="min-w-0 flex-1 space-y-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="space-y-1">
              <p className="truncate text-base font-medium">{title}</p>
              <p className="truncate text-sm text-muted-foreground">
                {item.name.trim() || '未命名团队'}
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <Badge variant="outline">创建者</Badge>
              {item.mySignup?.isLeader ? (
                <Badge variant="outline">团长</Badge>
              ) : null}
              {roleLabel ? <Badge variant="outline">{roleLabel}</Badge> : null}
            </div>

            {characterLine ? (
              <p className="text-sm text-muted-foreground">{characterLine}</p>
            ) : null}
          </Link>
        ) : (
          <div className="min-w-0 flex-1 space-y-2">
            <div className="space-y-1">
              <p className="truncate text-base font-medium">{title}</p>
              <p className="truncate text-sm text-muted-foreground">
                {item.name.trim() || '未命名团队'}
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {item.mySignup?.isLeader ? (
                <Badge variant="outline">团长</Badge>
              ) : null}
              {roleLabel ? <Badge variant="outline">{roleLabel}</Badge> : null}
            </div>

            {characterLine ? (
              <p className="text-sm text-muted-foreground">{characterLine}</p>
            ) : null}
          </div>
        )}

        <div className="flex shrink-0 flex-col items-end justify-between gap-2 border-l border-border/60 pl-4">
          <RaidHistoryStatusMenuComponent item={item} filter={filter} />

          <div className="text-right">
            <p className="text-sm font-medium">{schedule.primary}</p>
            {schedule.secondary ? (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {schedule.secondary}
              </p>
            ) : null}
          </div>

          {item.isCreator ? (
            <Link
              to="/raids/create/$raidRunId"
              params={{ raidRunId: item.id }}
              className="inline-flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground"
            >
              编辑
              <ChevronRight className="size-3.5" />
            </Link>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );

  return card;
}
