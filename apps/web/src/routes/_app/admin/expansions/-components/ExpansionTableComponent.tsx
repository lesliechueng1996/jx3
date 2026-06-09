import type { AdminExpansionListItem } from '#/lib/api/admin/expansions-admin-api';
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

type ExpansionTableComponentProps = {
  items: AdminExpansionListItem[];
  isLoading?: boolean;
  pendingExpansionId: string | null;
  onEdit: (expansion: AdminExpansionListItem) => void;
  onDelete: (expansion: AdminExpansionListItem) => void;
};

const formatDate = (value: string | null): string => {
  if (!value) {
    return '-';
  }
  return new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium' }).format(
    new Date(`${value}T00:00:00`),
  );
};

export function ExpansionTableComponent({
  items,
  isLoading = false,
  pendingExpansionId,
  onEdit,
  onDelete,
}: ExpansionTableComponentProps) {
  return (
    <div className="relative rounded-lg border border-border">
      <TableLoadingOverlayComponent loading={isLoading} />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>资料片名称</TableHead>
            <TableHead>资料片等级</TableHead>
            <TableHead>描述</TableHead>
            <TableHead>起始日期</TableHead>
            <TableHead>终止日期</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {!isLoading && items.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="py-10 text-center text-muted-foreground"
              >
                暂无资料片数据
              </TableCell>
            </TableRow>
          ) : (
            items.map((expansion) => (
              <TableRow key={expansion.id}>
                <TableCell className="font-medium">{expansion.name}</TableCell>
                <TableCell>{expansion.level}</TableCell>
                <TableCell className="max-w-xs truncate">
                  {expansion.description ?? (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>{formatDate(expansion.startDate)}</TableCell>
                <TableCell>{formatDate(expansion.endDate)}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(expansion)}
                    >
                      编辑
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={pendingExpansionId === expansion.id}
                      onClick={() => onDelete(expansion)}
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
