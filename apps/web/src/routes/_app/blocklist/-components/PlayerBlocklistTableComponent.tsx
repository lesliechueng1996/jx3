import type { PlayerBlocklistItem } from '#/lib/api/blocklist-api';
import { TableLoadingOverlayComponent } from '@/components/TableLoadingOverlayComponent';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type PlayerBlocklistTableComponentProps = {
  items: PlayerBlocklistItem[];
  isLoading?: boolean;
  canDelete: boolean;
  pendingDeleteId: string | null;
  onDelete: (item: PlayerBlocklistItem) => void;
};

const formatDateTime = (value: string): string =>
  new Date(value).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

export function PlayerBlocklistTableComponent({
  items,
  isLoading = false,
  canDelete,
  pendingDeleteId,
  onDelete,
}: PlayerBlocklistTableComponentProps) {
  return (
    <div className="relative rounded-lg border border-border">
      <TableLoadingOverlayComponent loading={isLoading} />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>角色名</TableHead>
            <TableHead>服务器</TableHead>
            <TableHead>门派</TableHead>
            <TableHead>备注</TableHead>
            <TableHead>添加人</TableHead>
            <TableHead>添加时间</TableHead>
            {canDelete ? (
              <TableHead className="text-right">操作</TableHead>
            ) : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {!isLoading && items.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={canDelete ? 7 : 6}
                className="py-10 text-center text-muted-foreground"
              >
                暂无个人避雷记录
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">
                  {item.characterName}
                </TableCell>
                <TableCell>{item.serverName}</TableCell>
                <TableCell>{item.schoolName ?? '-'}</TableCell>
                <TableCell>{item.remark?.trim() || '-'}</TableCell>
                <TableCell>{item.createdByName}</TableCell>
                <TableCell>{formatDateTime(item.createdAt)}</TableCell>
                {canDelete ? (
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={pendingDeleteId === item.id}
                      onClick={() => onDelete(item)}
                    >
                      删除
                    </Button>
                  </TableCell>
                ) : null}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
