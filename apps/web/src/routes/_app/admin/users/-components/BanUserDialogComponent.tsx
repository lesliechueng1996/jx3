import { useEffect, useState } from 'react';
import type { AdminUserListItem } from '#/lib/users-admin-api';
import { cn } from '#/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

type BanUserDialogComponentProps = {
  user: AdminUserListItem | null;
  open: boolean;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (banReason: string) => void;
};

export function BanUserDialogComponent({
  user,
  open,
  pending,
  onOpenChange,
  onSubmit,
}: BanUserDialogComponentProps) {
  const [banReason, setBanReason] = useState('');

  useEffect(() => {
    if (open) {
      setBanReason('');
    }
  }, [open]);

  const trimmedReason = banReason.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>封禁用户</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          确定要封禁用户 {user?.name ?? ''} 吗？封禁后该用户将无法登录，所有会话将被撤销。
        </p>
        <div className="space-y-2">
          <Label htmlFor="ban-reason">封禁原因</Label>
          <textarea
            id="ban-reason"
            value={banReason}
            maxLength={500}
            rows={3}
            placeholder="请输入封禁原因"
            className={cn(
              'flex w-full min-w-0 rounded-md border border-input bg-transparent px-2.5 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30',
            )}
            onChange={(event) => setBanReason(event.target.value)}
          />
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            取消
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={pending || trimmedReason.length === 0}
            onClick={() => onSubmit(trimmedReason)}
          >
            确认封禁
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
