import type { AdminSeasonListItem } from '#/lib/api/admin/seasons-admin-api';
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
import { cn } from '@/lib/utils';

type SeasonTableComponentProps = {
  items: AdminSeasonListItem[];
  isLoading?: boolean;
  pendingSeasonId: string | null;
  onEdit: (season: AdminSeasonListItem) => void;
  onDelete: (season: AdminSeasonListItem) => void;
};

const formatDate = (value: string | null): string => {
  if (!value) {
    return '-';
  }
  return new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium' }).format(
    new Date(`${value}T00:00:00`),
  );
};

export function SeasonTableComponent({
  items,
  isLoading = false,
  pendingSeasonId,
  onEdit,
  onDelete,
}: SeasonTableComponentProps) {
  return (
    <div
      className={cn(
        'relative rounded-md border border-border bg-muted/30',
        isLoading && 'min-h-40',
      )}
    >
      <TableLoadingOverlayComponent loading={isLoading} />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">排序</TableHead>
            <TableHead>赛季名称</TableHead>
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
                className="py-8 text-center text-muted-foreground"
              >
                暂无赛季数据
              </TableCell>
            </TableRow>
          ) : (
            items.map((season) => (
              <TableRow key={season.id}>
                <TableCell>{season.sortOrder}</TableCell>
                <TableCell className="font-medium">{season.name}</TableCell>
                <TableCell className="max-w-xs truncate">
                  {season.description ?? (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>{formatDate(season.startDate)}</TableCell>
                <TableCell>{formatDate(season.endDate)}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(season)}
                    >
                      编辑
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={pendingSeasonId === season.id}
                      onClick={() => onDelete(season)}
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
