import type { RaidBrandBlocklistItem } from '#/lib/api/blocklist-api';
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

type RaidBrandBlocklistTableComponentProps = {
  items: RaidBrandBlocklistItem[];
  isLoading?: boolean;
  canDelete: boolean;
  pendingDeleteId: string | null;
  onDelete: (item: RaidBrandBlocklistItem) => void;
};

const formatDateTime = (value: string): string =>
  new Date(value).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

export function RaidBrandBlocklistTableComponent({
  items,
  isLoading = false,
  canDelete,
  pendingDeleteId,
  onDelete,
}: RaidBrandBlocklistTableComponentProps) {
  return (
    <div className="relative rounded-lg border border-border">
      <TableLoadingOverlayComponent loading={isLoading} />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>团牌名称</TableHead>
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
                colSpan={canDelete ? 5 : 4}
                className="py-10 text-center text-muted-foreground"
              >
                暂无团牌避雷记录
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
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
