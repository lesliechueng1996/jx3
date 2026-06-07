import { APP_ROLE_LABELS, APP_ROLES, type AppRole } from '@jx3/auth/roles';
import { useEffect, useState } from 'react';
import type { AdminUserListItem } from '#/lib/api/admin/users-admin-api';
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

type EditUserDialogComponentProps = {
  user: AdminUserListItem | null;
  open: boolean;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: { name: string; role: AppRole }) => void;
};

export function EditUserDialogComponent({
  user,
  open,
  pending,
  onOpenChange,
  onSubmit,
}: EditUserDialogComponentProps) {
  const [name, setName] = useState('');
  const [role, setRole] = useState<AppRole>('user');

  useEffect(() => {
    if (user) {
      setName(user.name);
      setRole((user.role as AppRole | null) ?? 'user');
    }
  }, [user]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>编辑用户</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-user-name">用户名</Label>
            <Input
              id="edit-user-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>角色</Label>
            <Select
              value={role}
              onValueChange={(value) => setRole(value as AppRole)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {APP_ROLES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {APP_ROLE_LABELS[item]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            disabled={pending || name.trim().length === 0}
            onClick={() => onSubmit({ name: name.trim(), role })}
          >
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
