import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type RecordDungeonIdDialogComponentProps = {
  open: boolean;
  gameRaidId: string | null;
  pending?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (gameRaidId: string | null) => void;
};

export function RecordDungeonIdDialogComponent({
  open,
  gameRaidId,
  pending = false,
  onOpenChange,
  onSubmit,
}: RecordDungeonIdDialogComponentProps) {
  const [input, setInput] = useState('');

  useEffect(() => {
    if (!open) {
      return;
    }

    setInput(gameRaidId ?? '');
  }, [open, gameRaidId]);

  const handleSubmit = () => {
    const trimmed = input.trim();
    onSubmit(trimmed ? trimmed : null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>记录副本ID</DialogTitle>
          <DialogDescription>
            填写游戏内开团 ID，便于后续对照或同步。留空并保存可清除已有记录。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="game-raid-id">副本 ID</Label>
          <Input
            id="game-raid-id"
            disabled={pending}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="粘贴游戏内开团 ID"
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            disabled={pending}
            onClick={() => onOpenChange(false)}
          >
            取消
          </Button>
          <Button disabled={pending} onClick={handleSubmit}>
            {pending ? '保存中…' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
