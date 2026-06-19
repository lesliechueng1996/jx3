import {
  type AdminGameItemListItem,
  ITEM_QUALITY_CLASS,
  ITEM_QUALITY_LABELS,
  ITEM_TYPE_LABELS,
  type ItemQuality,
  type ItemType,
} from '#/lib/api/admin/game-items-admin-api';
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
import { cn } from '@/lib/utils';

type ItemTableComponentProps = {
  items: AdminGameItemListItem[];
  isLoading?: boolean;
  pendingItemId: string | null;
  onEdit: (item: AdminGameItemListItem) => void;
  onDelete: (item: AdminGameItemListItem) => void;
};

const formatType = (type: ItemType): string => ITEM_TYPE_LABELS[type];

const formatQuality = (quality: ItemQuality): string =>
  ITEM_QUALITY_LABELS[quality];

export function ItemTableComponent({
  items,
  isLoading = false,
  pendingItemId,
  onEdit,
  onDelete,
}: ItemTableComponentProps) {
  return (
    <div className="relative rounded-lg border border-border">
      <TableLoadingOverlayComponent loading={isLoading} />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>物品名称</TableHead>
            <TableHead>游戏 ID</TableHead>
            <TableHead>类型</TableHead>
            <TableHead>品质</TableHead>
            <TableHead>图标</TableHead>
            <TableHead>别称</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {!isLoading && items.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="py-10 text-center text-muted-foreground"
              >
                暂无物品数据
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>
                  {item.gameItemId ?? (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>{formatType(item.type)}</TableCell>
                <TableCell>
                  <span className={cn(ITEM_QUALITY_CLASS[item.quality])}>
                    {formatQuality(item.quality)}
                  </span>
                </TableCell>
                <TableCell>
                  {item.icon ? (
                    <img
                      src={item.icon}
                      alt={`${item.name} 图标`}
                      className="size-8 rounded object-cover"
                    />
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {item.alias.length === 0 ? (
                      <span className="text-muted-foreground">-</span>
                    ) : (
                      item.alias.map((alias) => (
                        <Badge key={alias} variant="secondary">
                          {alias}
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
                      onClick={() => onEdit(item)}
                    >
                      编辑
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={pendingItemId === item.id}
                      onClick={() => onDelete(item)}
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
