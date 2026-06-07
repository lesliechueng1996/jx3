import {
  APP_ROLE_LABELS,
  type AppRole,
  AUTH_PROVIDER_LABELS,
} from '@jx3/auth/roles';
import type { AdminUserListItem } from '#/lib/api/admin/users-admin-api';
import { TableLoadingOverlayComponent } from '@/components/TableLoadingOverlayComponent';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type UserTableComponentProps = {
  items: AdminUserListItem[];
  isLoading?: boolean;
  currentUserId: string;
  pendingUserId: string | null;
  onBanToggle: (user: AdminUserListItem, banned: boolean) => void;
  onEdit: (user: AdminUserListItem) => void;
  onDelete: (user: AdminUserListItem) => void;
  onRevokeSessions: (user: AdminUserListItem) => void;
};

const formatDateTime = (value: string | null): string => {
  if (!value) {
    return '-';
  }
  return new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

const formatRole = (role: string | null): string => {
  if (!role) {
    return '-';
  }
  if (role in APP_ROLE_LABELS) {
    return APP_ROLE_LABELS[role as AppRole];
  }
  return role;
};

export function UserTableComponent({
  items,
  isLoading = false,
  currentUserId,
  pendingUserId,
  onBanToggle,
  onEdit,
  onDelete,
  onRevokeSessions,
}: UserTableComponentProps) {
  return (
    <div className="relative rounded-lg border border-border">
      <TableLoadingOverlayComponent loading={isLoading} />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>用户名</TableHead>
            <TableHead>邮箱</TableHead>
            <TableHead>角色</TableHead>
            <TableHead>封禁</TableHead>
            <TableHead>封禁原因</TableHead>
            <TableHead>封禁日期</TableHead>
            <TableHead>登录 IP</TableHead>
            <TableHead>登录方式</TableHead>
            <TableHead>创建时间</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {!isLoading && items.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={10}
                className="py-10 text-center text-muted-foreground"
              >
                暂无用户数据
              </TableCell>
            </TableRow>
          ) : (
            items.map((user) => {
              const isSelf = user.id === currentUserId;
              return (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.emailMasked}</TableCell>
                  <TableCell>{formatRole(user.role)}</TableCell>
                  <TableCell>
                    <Switch
                      checked={user.banned}
                      disabled={isSelf || pendingUserId === user.id}
                      onCheckedChange={(checked) => onBanToggle(user, checked)}
                      aria-label={
                        isSelf
                          ? `无法封禁当前登录用户 ${user.name}`
                          : `切换 ${user.name} 的封禁状态`
                      }
                    />
                  </TableCell>
                  <TableCell>{user.banReason ?? '-'}</TableCell>
                  <TableCell>{formatDateTime(user.banDate)}</TableCell>
                  <TableCell>{user.lastLoginIp ?? '-'}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.providers.length === 0 ? (
                        <span className="text-muted-foreground">-</span>
                      ) : (
                        user.providers.map((provider) => (
                          <Badge key={provider} variant="secondary">
                            {AUTH_PROVIDER_LABELS[provider]}
                          </Badge>
                        ))
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{formatDateTime(user.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(user)}
                      >
                        编辑
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={pendingUserId === user.id}
                        onClick={() => onRevokeSessions(user)}
                      >
                        撤销会话
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        disabled={pendingUserId === user.id}
                        onClick={() => onDelete(user)}
                      >
                        删除
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
