import { useEffect, useState } from 'react';
import {
  type AdminSchoolListItem,
  formatAliasInput,
  parseAliasInput,
  SCHOOL_TYPE_LABELS,
  SCHOOL_TYPES,
  type SchoolFormValues,
  type SchoolType,
} from '#/lib/api/admin/schools-admin-api';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type SchoolFormDialogComponentProps = {
  school: AdminSchoolListItem | null;
  mode: 'create' | 'edit';
  open: boolean;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: SchoolFormValues) => void;
};

const emptyForm = (): SchoolFormValues => ({
  name: '',
  type: 'school',
  icon: null,
  alias: [],
});

export function SchoolFormDialogComponent({
  school,
  mode,
  open,
  pending,
  onOpenChange,
  onSubmit,
}: SchoolFormDialogComponentProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<SchoolType>('school');
  const [icon, setIcon] = useState('');
  const [aliasInput, setAliasInput] = useState('');

  useEffect(() => {
    if (mode === 'edit' && school) {
      setName(school.name);
      setType(school.type);
      setIcon(school.icon ?? '');
      setAliasInput(formatAliasInput(school.alias));
      return;
    }

    if (mode === 'create') {
      const defaults = emptyForm();
      setName(defaults.name);
      setType(defaults.type);
      setIcon('');
      setAliasInput('');
    }
  }, [mode, school]);

  const handleSubmit = () => {
    onSubmit({
      name: name.trim(),
      type,
      icon: icon.trim() ? icon.trim() : null,
      alias: parseAliasInput(aliasInput),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? '新建门派' : '编辑门派'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="school-name">门派名称</Label>
            <Input
              id="school-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>类型</Label>
            <Select
              value={type}
              onValueChange={(value) => setType(value as SchoolType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SCHOOL_TYPES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {SCHOOL_TYPE_LABELS[item]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="school-icon">图标 URL</Label>
            <Input
              id="school-icon"
              value={icon}
              placeholder="可选，填写图标地址"
              onChange={(event) => setIcon(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="school-alias">别称</Label>
            <Input
              id="school-alias"
              value={aliasInput}
              placeholder="多个别称请用逗号分隔"
              onChange={(event) => setAliasInput(event.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            取消
          </Button>
          <Button
            type="button"
            disabled={pending || name.trim().length === 0}
            onClick={handleSubmit}
          >
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
