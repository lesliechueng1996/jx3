import {
  type AdminDungeonListItem,
  DUNGEON_DIFFICULTY_LABELS,
  type DungeonDifficulty,
  formatResetWeekdays,
} from '#/lib/api/admin/dungeons-admin-api';
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

type DungeonTableComponentProps = {
  items: AdminDungeonListItem[];
  isLoading?: boolean;
  pendingDungeonId: string | null;
  onEdit: (dungeon: AdminDungeonListItem) => void;
  onDelete: (dungeon: AdminDungeonListItem) => void;
};

const formatDifficulty = (difficulty: DungeonDifficulty): string =>
  DUNGEON_DIFFICULTY_LABELS[difficulty];

export function DungeonTableComponent({
  items,
  isLoading = false,
  pendingDungeonId,
  onEdit,
  onDelete,
}: DungeonTableComponentProps) {
  return (
    <div className="relative rounded-lg border border-border">
      <TableLoadingOverlayComponent loading={isLoading} />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>副本名称</TableHead>
            <TableHead>资料片</TableHead>
            <TableHead>赛季</TableHead>
            <TableHead>玩家数</TableHead>
            <TableHead>难度</TableHead>
            <TableHead>等级要求</TableHead>
            <TableHead>Boss 数量</TableHead>
            <TableHead>CD 刷新日</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {!isLoading && items.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={9}
                className="py-10 text-center text-muted-foreground"
              >
                暂无副本数据
              </TableCell>
            </TableRow>
          ) : (
            items.map((dungeon) => (
              <TableRow key={dungeon.id}>
                <TableCell className="font-medium">{dungeon.name}</TableCell>
                <TableCell>{dungeon.expansionName}</TableCell>
                <TableCell>{dungeon.seasonName}</TableCell>
                <TableCell>{dungeon.playerLimit}</TableCell>
                <TableCell>{formatDifficulty(dungeon.difficulty)}</TableCell>
                <TableCell>{dungeon.levelRequirement}</TableCell>
                <TableCell>{dungeon.bossCount}</TableCell>
                <TableCell>
                  {formatResetWeekdays(dungeon.resetWeekdays)}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(dungeon)}
                    >
                      编辑
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={pendingDungeonId === dungeon.id}
                      onClick={() => onDelete(dungeon)}
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
