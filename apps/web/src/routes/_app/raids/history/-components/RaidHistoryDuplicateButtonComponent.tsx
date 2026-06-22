import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import {
  type RaidHistoryFilter,
  type RaidRunListItem,
  raidRunsApi,
  raidRunsMineQueryKey,
} from '#/lib/api/raid-runs-api';
import { ApiRequestError } from '#/lib/api/request';
import { Button } from '@/components/ui/button';

type RaidHistoryDuplicateButtonComponentProps = {
  item: RaidRunListItem;
  filter: RaidHistoryFilter;
};

export function RaidHistoryDuplicateButtonComponent({
  item,
  filter,
}: RaidHistoryDuplicateButtonComponentProps) {
  const queryClient = useQueryClient();

  const duplicateMutation = useMutation({
    mutationFn: () => raidRunsApi.duplicate(item.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [...raidRunsMineQueryKey, filter],
      });
      toast.success('已拷贝创建新团队');
    },
    onError: (error) => {
      if (error instanceof ApiRequestError) {
        toast.error(error.message);
        return;
      }
      toast.error('拷贝创建失败');
    },
  });

  if (!item.isCreator) {
    return null;
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
      disabled={duplicateMutation.isPending}
      onClick={(event) => {
        event.stopPropagation();
        duplicateMutation.mutate();
      }}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <Copy className="size-3.5" />
      拷贝创建
    </Button>
  );
}
