import { useMutation } from '@tanstack/react-query';
import { ShieldAlert } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  type BlocklistMatchEntry,
  blocklistApi,
  type RaidRunBlocklistCheckResponse,
} from '#/lib/api/blocklist-api';
import { ApiRequestError } from '#/lib/api/request';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type RaidHistoryBlocklistCheckButtonComponentProps = {
  raidRunId: string;
};

const formatMatchLine = (match: BlocklistMatchEntry): string => {
  const signupServer = match.serverName ? ` · ${match.serverName}` : '';
  const blocklistMeta = [match.blocklistServerName, match.blocklistSchoolName]
    .filter(Boolean)
    .join(' · ');
  const remark = match.remark?.trim() ? `（${match.remark.trim()}）` : '';
  return `${match.characterName}${signupServer} ↔ 避雷记录：${blocklistMeta}${remark}`;
};

const buildResultMessage = (result: RaidRunBlocklistCheckResponse): string => {
  if (result.passed) {
    return result.skippedCount > 0
      ? `检测通过，未发现避雷人员（${result.skippedCount} 个格子因缺少区服未参与检测）`
      : '检测通过，未发现避雷人员';
  }
  return '';
};

export function RaidHistoryBlocklistCheckButtonComponent({
  raidRunId,
}: RaidHistoryBlocklistCheckButtonComponentProps) {
  const [result, setResult] = useState<RaidRunBlocklistCheckResponse | null>(
    null,
  );

  const checkMutation = useMutation({
    mutationFn: () => blocklistApi.checkRaidRun(raidRunId),
    onSuccess: (data) => {
      if (data.passed) {
        toast.success(buildResultMessage(data));
        return;
      }
      setResult(data);
    },
    onError: (error) => {
      if (error instanceof ApiRequestError) {
        toast.error(error.message);
        return;
      }
      toast.error('避雷检测失败');
    },
  });

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
        disabled={checkMutation.isPending}
        onClick={(event) => {
          event.stopPropagation();
          checkMutation.mutate();
        }}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <ShieldAlert className="size-3.5" />
        避雷检测
      </Button>

      <Dialog
        open={result !== null}
        onOpenChange={(open) => !open && setResult(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>检测到避雷风险</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            {result && result.confirmedMatches.length > 0 ? (
              <div className="space-y-2">
                <p className="font-medium text-destructive">确认避雷</p>
                <ul className="space-y-1 text-muted-foreground">
                  {result.confirmedMatches.map((match) => (
                    <li
                      key={`confirmed-${match.signupId}-${match.blocklistServerName}`}
                    >
                      {formatMatchLine(match)}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {result && result.possibleMatches.length > 0 ? (
              <div className="space-y-2">
                <p className="font-medium text-amber-600">可能避雷</p>
                <ul className="space-y-1 text-muted-foreground">
                  {result.possibleMatches.map((match) => (
                    <li
                      key={`possible-${match.signupId}-${match.blocklistServerName}`}
                    >
                      {formatMatchLine(match)}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {result && result.skippedCount > 0 ? (
              <p className="text-xs text-muted-foreground">
                {result.skippedCount}{' '}
                个格子因缺少区服未参与确认检测，但已参与可能避雷匹配。
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="button" onClick={() => setResult(null)}>
              知道了
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
