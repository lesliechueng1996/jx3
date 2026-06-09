import { useEffect, useState } from 'react';
import {
  type AdminGameServerListItem,
  formatAliasInput,
  type GameServerFormValues,
  parseAliasInput,
} from '#/lib/api/admin/game-servers-admin-api';
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

type ServerFormDialogComponentProps = {
  server: AdminGameServerListItem | null;
  mode: 'create' | 'edit';
  open: boolean;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: GameServerFormValues) => void;
};

const emptyForm = (): GameServerFormValues => ({
  serverId: '',
  zone: '',
  name: '',
  alias: [],
});

export function ServerFormDialogComponent({
  server,
  mode,
  open,
  pending,
  onOpenChange,
  onSubmit,
}: ServerFormDialogComponentProps) {
  const [serverId, setServerId] = useState('');
  const [zone, setZone] = useState('');
  const [name, setName] = useState('');
  const [aliasInput, setAliasInput] = useState('');

  useEffect(() => {
    if (mode === 'edit' && server) {
      setServerId(server.serverId);
      setZone(server.zone);
      setName(server.name);
      setAliasInput(formatAliasInput(server.alias));
      return;
    }

    if (mode === 'create') {
      const defaults = emptyForm();
      setServerId(defaults.serverId);
      setZone(defaults.zone);
      setName(defaults.name);
      setAliasInput('');
    }
  }, [mode, server]);

  const isValid =
    serverId.trim().length > 0 &&
    zone.trim().length > 0 &&
    name.trim().length > 0;

  const handleSubmit = () => {
    onSubmit({
      serverId: serverId.trim(),
      zone: zone.trim(),
      name: name.trim(),
      alias: parseAliasInput(aliasInput),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? '新建服务器' : '编辑服务器'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? '填写服务器 ID、大区及名称以创建新记录。'
              : '修改服务器信息后保存。'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="game-server-id">服务器 ID</Label>
            <Input
              id="game-server-id"
              value={serverId}
              onChange={(event) => setServerId(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="game-server-zone">大区</Label>
            <Input
              id="game-server-zone"
              value={zone}
              onChange={(event) => setZone(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="game-server-name">服务器名称</Label>
            <Input
              id="game-server-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="game-server-alias">别名</Label>
            <Input
              id="game-server-alias"
              value={aliasInput}
              placeholder="多个别名请用逗号分隔"
              onChange={(event) => setAliasInput(event.target.value)}
            />
          </div>
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
            disabled={pending || !isValid}
            onClick={handleSubmit}
          >
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
