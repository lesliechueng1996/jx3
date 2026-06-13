import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type SyncServersConfirmDialogComponentProps = {
  open: boolean;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function SyncServersConfirmDialogComponent({
  open,
  pending,
  onOpenChange,
  onConfirm,
}: SyncServersConfirmDialogComponentProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>同步服务器数据</DialogTitle>
          <DialogDescription>
            此操作将从 JX3Box 拉取最新服务器列表，并按名称更新已有服务器的
            ID、大区与别名，同时插入数据库中尚未存在的记录。不会删除已有服务器，请确认后继续。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => onOpenChange(false)}
          >
            取消
          </Button>
          <Button type="button" disabled={pending} onClick={onConfirm}>
            确认同步
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
