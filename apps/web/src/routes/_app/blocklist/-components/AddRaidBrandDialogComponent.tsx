import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type AddRaidBrandDialogComponentProps = {
  open: boolean;
  pending?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: { name: string; remark?: string | null }) => void;
};

export function AddRaidBrandDialogComponent({
  open,
  pending = false,
  onOpenChange,
  onSubmit,
}: AddRaidBrandDialogComponentProps) {
  const [name, setName] = useState('');
  const [remark, setRemark] = useState('');

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setName('');
      setRemark('');
    }
    onOpenChange(nextOpen);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      return;
    }
    onSubmit({
      name: trimmedName,
      remark: remark.trim() || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新增避雷团牌</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="blocklist-brand-name">团牌名称</Label>
            <Input
              id="blocklist-brand-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="请输入团牌名称"
              disabled={pending}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="blocklist-brand-remark">备注</Label>
            <Textarea
              id="blocklist-brand-remark"
              value={remark}
              onChange={(event) => setRemark(event.target.value)}
              placeholder="避雷原因（可选）"
              disabled={pending}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => handleOpenChange(false)}
            >
              取消
            </Button>
            <Button type="submit" disabled={pending || !name.trim()}>
              添加
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
