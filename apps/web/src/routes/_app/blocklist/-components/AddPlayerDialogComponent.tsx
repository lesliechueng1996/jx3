import { useState } from 'react';
import type { AdminGameServerListItem } from '#/lib/api/admin/game-servers-admin-api';
import type { SchoolOption } from '#/lib/api/admin/schools-admin-api';
import { formatServerLabel } from '#/routes/_app/raids/create/-components/searchable-option-utils';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

type AddPlayerDialogComponentProps = {
  open: boolean;
  pending?: boolean;
  servers: AdminGameServerListItem[];
  schools: SchoolOption[];
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: {
    characterName: string;
    serverId: string;
    schoolId?: string | null;
    remark?: string | null;
  }) => void;
};

export function AddPlayerDialogComponent({
  open,
  pending = false,
  servers,
  schools,
  onOpenChange,
  onSubmit,
}: AddPlayerDialogComponentProps) {
  const [characterName, setCharacterName] = useState('');
  const [serverId, setServerId] = useState('');
  const [schoolId, setSchoolId] = useState('__none__');
  const [remark, setRemark] = useState('');

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setCharacterName('');
      setServerId('');
      setSchoolId('__none__');
      setRemark('');
    }
    onOpenChange(nextOpen);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedName = characterName.trim();
    if (!trimmedName || !serverId) {
      return;
    }
    onSubmit({
      characterName: trimmedName,
      serverId,
      schoolId: schoolId === '__none__' ? null : schoolId,
      remark: remark.trim() || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新增避雷个人</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="blocklist-player-name">角色名</Label>
            <Input
              id="blocklist-player-name"
              value={characterName}
              onChange={(event) => setCharacterName(event.target.value)}
              placeholder="请输入角色名"
              disabled={pending}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="blocklist-player-server">服务器</Label>
            <Select
              value={serverId}
              onValueChange={setServerId}
              disabled={pending}
            >
              <SelectTrigger id="blocklist-player-server" className="w-full">
                <SelectValue placeholder="请选择服务器" />
              </SelectTrigger>
              <SelectContent>
                {servers.map((server) => (
                  <SelectItem key={server.id} value={server.id}>
                    {formatServerLabel(server)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="blocklist-player-school">门派（可选）</Label>
            <Select
              value={schoolId}
              onValueChange={setSchoolId}
              disabled={pending}
            >
              <SelectTrigger id="blocklist-player-school" className="w-full">
                <SelectValue placeholder="不选择门派" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">不选择门派</SelectItem>
                {schools.map((school) => (
                  <SelectItem key={school.id} value={school.id}>
                    {school.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="blocklist-player-remark">备注</Label>
            <Textarea
              id="blocklist-player-remark"
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
            <Button
              type="submit"
              disabled={pending || !characterName.trim() || !serverId}
            >
              添加
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
