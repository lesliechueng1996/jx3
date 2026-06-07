import {
  type AdminSchoolListItem,
  SCHOOL_TYPE_LABELS,
  type SchoolType,
} from '#/lib/api/admin/schools-admin-api';
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

type SchoolTableComponentProps = {
  items: AdminSchoolListItem[];
  pendingSchoolId: string | null;
  onEdit: (school: AdminSchoolListItem) => void;
  onDelete: (school: AdminSchoolListItem) => void;
};

const formatType = (type: SchoolType): string => SCHOOL_TYPE_LABELS[type];

export function SchoolTableComponent({
  items,
  pendingSchoolId,
  onEdit,
  onDelete,
}: SchoolTableComponentProps) {
  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>门派名称</TableHead>
            <TableHead>类型</TableHead>
            <TableHead>图标</TableHead>
            <TableHead>别称</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="py-10 text-center text-muted-foreground"
              >
                暂无门派数据
              </TableCell>
            </TableRow>
          ) : (
            items.map((school) => (
              <TableRow key={school.id}>
                <TableCell className="font-medium">{school.name}</TableCell>
                <TableCell>{formatType(school.type)}</TableCell>
                <TableCell>
                  {school.icon ? (
                    <img
                      src={school.icon}
                      alt={`${school.name} 图标`}
                      className="size-8 rounded object-cover"
                    />
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {school.alias.length === 0 ? (
                      <span className="text-muted-foreground">-</span>
                    ) : (
                      school.alias.map((item) => (
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
                      onClick={() => onEdit(school)}
                    >
                      编辑
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={pendingSchoolId === school.id}
                      onClick={() => onDelete(school)}
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
