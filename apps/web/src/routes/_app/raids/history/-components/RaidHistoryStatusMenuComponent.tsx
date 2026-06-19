import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  type RaidHistoryFilter,
  type RaidRunListItem,
  raidRunsApi,
  raidRunsMineQueryKey,
} from '#/lib/api/raid-runs-api';
import { ApiRequestError } from '#/lib/api/request';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
  getRaidRunStatusActions,
  RAID_RUN_STATUS_LABELS,
  type RaidRunStatusAction,
} from './raid-history-utils';

type RaidHistoryStatusMenuComponentProps = {
  item: RaidRunListItem;
  filter: RaidHistoryFilter;
};

export function RaidHistoryStatusMenuComponent({
  item,
  filter,
}: RaidHistoryStatusMenuComponentProps) {
  const queryClient = useQueryClient();
  const [pendingAction, setPendingAction] =
    useState<RaidRunStatusAction | null>(null);
  const actions = getRaidRunStatusActions(item.status);

  const updateStatusMutation = useMutation({
    mutationFn: (status: Exclude<RaidRunListItem['status'], 'pending'>) =>
      raidRunsApi.updateStatus(item.id, status),
    onSuccess: (_data, status) => {
      void queryClient.invalidateQueries({
        queryKey: [...raidRunsMineQueryKey, filter],
      });
      toast.success(`团队状态已更新为「${RAID_RUN_STATUS_LABELS[status]}」`);
      setPendingAction(null);
    },
    onError: (error) => {
      if (error instanceof ApiRequestError) {
        toast.error(error.message);
        return;
      }
      toast.error('更新团队状态失败');
    },
  });

  const handleSelectAction = (action: RaidRunStatusAction) => {
    if (action.confirmMessage) {
      setPendingAction(action);
      return;
    }

    updateStatusMutation.mutate(
      action.target as Exclude<RaidRunListItem['status'], 'pending'>,
    );
  };

  if (!item.isCreator || actions.length === 0) {
    return <BadgeLikeStatus status={item.status} interactive={false} />;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="h-7 gap-1 px-2 text-xs"
            disabled={updateStatusMutation.isPending}
            onClick={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
          >
            {RAID_RUN_STATUS_LABELS[item.status]}
            <ChevronDown className="size-3.5 opacity-70" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          onClick={(event) => event.stopPropagation()}
        >
          {actions.map((action) => (
            <DropdownMenuItem
              key={action.target}
              variant={action.destructive ? 'destructive' : 'default'}
              disabled={updateStatusMutation.isPending}
              onSelect={() => handleSelectAction(action)}
            >
              {action.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog
        open={pendingAction !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingAction(null);
          }
        }}
      >
        <DialogContent onClick={(event) => event.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>{pendingAction?.label}</DialogTitle>
            <DialogDescription>
              {pendingAction?.confirmMessage}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPendingAction(null)}
              disabled={updateStatusMutation.isPending}
            >
              返回
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={updateStatusMutation.isPending}
              onClick={() => {
                if (!pendingAction) {
                  return;
                }

                updateStatusMutation.mutate(
                  pendingAction.target as Exclude<
                    RaidRunListItem['status'],
                    'pending'
                  >,
                );
              }}
            >
              确认
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function BadgeLikeStatus({
  status,
  interactive,
}: {
  status: RaidRunListItem['status'];
  interactive: boolean;
}) {
  return (
    <span
      className={cn(
        'inline-flex h-7 items-center rounded-md bg-secondary px-2 text-xs font-medium text-secondary-foreground',
        interactive && 'gap-1',
      )}
    >
      {RAID_RUN_STATUS_LABELS[status]}
    </span>
  );
}
