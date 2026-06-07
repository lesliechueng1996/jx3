import {
  type AdminKungfuListItem,
  ATTACK_METHOD_LABELS,
  ATTACK_TYPE_LABELS,
  type AttackMethod,
  type AttackType,
  formatBooleanLabel,
  KUNGFU_TYPE_LABELS,
  type KungfuType,
} from '#/lib/api/admin/kungfu-admin-api';
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

type KungfuTableComponentProps = {
  items: AdminKungfuListItem[];
  isLoading?: boolean;
  pendingKungfuId: string | null;
  onEdit: (kungfu: AdminKungfuListItem) => void;
  onDelete: (kungfu: AdminKungfuListItem) => void;
};

const formatKungfuType = (type: KungfuType): string => KUNGFU_TYPE_LABELS[type];

const formatAttackType = (type: AttackType | null): string =>
  type ? ATTACK_TYPE_LABELS[type] : '-';

const formatAttackMethod = (method: AttackMethod | null): string =>
  method ? ATTACK_METHOD_LABELS[method] : '-';

export function KungfuTableComponent({
  items,
  isLoading = false,
  pendingKungfuId,
  onEdit,
  onDelete,
}: KungfuTableComponentProps) {
  return (
    <div className="relative rounded-lg border border-border">
      <TableLoadingOverlayComponent loading={isLoading} />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>心法名称</TableHead>
            <TableHead>所属门派</TableHead>
            <TableHead>图标</TableHead>
            <TableHead>心法类型</TableHead>
            <TableHead>攻击类型</TableHead>
            <TableHead>攻击方式</TableHead>
            <TableHead>阵眼名称</TableHead>
            <TableHead>外功阵眼</TableHead>
            <TableHead>内功阵眼</TableHead>
            <TableHead>无界</TableHead>
            <TableHead>别名</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {!isLoading && items.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={12}
                className="py-10 text-center text-muted-foreground"
              >
                暂无心法数据
              </TableCell>
            </TableRow>
          ) : (
            items.map((kungfu) => (
              <TableRow key={kungfu.id}>
                <TableCell className="font-medium">{kungfu.name}</TableCell>
                <TableCell>{kungfu.schoolName}</TableCell>
                <TableCell>
                  {kungfu.icon ? (
                    <img
                      src={kungfu.icon}
                      alt={`${kungfu.name} 图标`}
                      className="size-8 rounded object-cover"
                    />
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>{formatKungfuType(kungfu.kungfuType)}</TableCell>
                <TableCell>{formatAttackType(kungfu.attackType)}</TableCell>
                <TableCell>{formatAttackMethod(kungfu.attackMethod)}</TableCell>
                <TableCell>
                  {kungfu.formationName ?? (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {formatBooleanLabel(kungfu.isPveExternalRecommended)}
                </TableCell>
                <TableCell>
                  {formatBooleanLabel(kungfu.isPveInternalRecommended)}
                </TableCell>
                <TableCell>{formatBooleanLabel(kungfu.isUnlimited)}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {kungfu.alias.length === 0 ? (
                      <span className="text-muted-foreground">-</span>
                    ) : (
                      kungfu.alias.map((item) => (
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
                      onClick={() => onEdit(kungfu)}
                    >
                      编辑
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={pendingKungfuId === kungfu.id}
                      onClick={() => onDelete(kungfu)}
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
