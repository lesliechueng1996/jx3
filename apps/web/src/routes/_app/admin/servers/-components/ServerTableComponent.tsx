import type { AdminGameServerListItem } from '#/lib/api/admin/game-servers-admin-api';
import { TableLoadingOverlayComponent } from '@/components/TableLoadingOverlayComponent';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type ServerTableComponentProps = {
  items: AdminGameServerListItem[];
  isLoading?: boolean;
  pendingServerId: string | null;
  onEdit: (server: AdminGameServerListItem) => void;
  onDelete: (server: AdminGameServerListItem) => void;
};

export function ServerTableComponent({
  items,
  isLoading = false,
  pendingServerId,
  onEdit,
  onDelete,
}: ServerTableComponentProps) {
  return (
    <div className="relative rounded-lg border border-border">
      <TableLoadingOverlayComponent loading={isLoading} />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>服务器 ID</TableHead>
            <TableHead>大区</TableHead>
            <TableHead>服务器名称</TableHead>
            <TableHead>别名</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {!isLoading && items.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="py-10 text-center text-muted-foreground"
              >
                暂无服务器数据
              </TableCell>
            </TableRow>
          ) : (
            items.map((server) => (
              <TableRow key={server.id}>
                <TableCell className="font-mono text-sm">
                  {server.serverId}
                </TableCell>
                <TableCell>{server.zone}</TableCell>
                <TableCell className="font-medium">{server.name}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {server.alias.length === 0 ? (
                      <span className="text-muted-foreground">-</span>
                    ) : (
                      server.alias.map((item) => (
                        <Badge key={item} variant="secondary">
                          {item}
                        </Badge>
                      ))
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(server)}
                    >
                      编辑
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={pendingServerId === server.id}
                      onClick={() => onDelete(server)}
                    >
                      删除
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
