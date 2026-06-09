import { useEffect, useState } from 'react';
import type {
  AdminExpansionListItem,
  ExpansionFormValues,
} from '#/lib/api/admin/expansions-admin-api';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type ExpansionFormDialogComponentProps = {
  expansion: AdminExpansionListItem | null;
  mode: 'create' | 'edit';
  open: boolean;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: ExpansionFormValues) => void;
};

const emptyForm = (): ExpansionFormValues => ({
  name: '',
  description: null,
  level: 130,
  startDate: '',
  endDate: null,
});

export function ExpansionFormDialogComponent({
  expansion,
  mode,
  open,
  pending,
  onOpenChange,
  onSubmit,
}: ExpansionFormDialogComponentProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState('130');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (mode === 'edit' && expansion) {
      setName(expansion.name);
      setDescription(expansion.description ?? '');
      setLevel(String(expansion.level));
      setStartDate(expansion.startDate);
      setEndDate(expansion.endDate ?? '');
      return;
    }

    if (mode === 'create') {
      const defaults = emptyForm();
      setName(defaults.name);
      setDescription('');
      setLevel(String(defaults.level));
      setStartDate(defaults.startDate);
      setEndDate('');
    }
  }, [mode, expansion]);

  const parsedLevel = Number.parseInt(level, 10);
  const isValid =
    name.trim().length > 0 &&
    startDate.length > 0 &&
    Number.isInteger(parsedLevel) &&
    parsedLevel >= 1;

  const handleSubmit = () => {
    if (!isValid) {
      return;
    }

    onSubmit({
      name: name.trim(),
      description: description.trim() ? description.trim() : null,
      level: parsedLevel,
      startDate,
      endDate: endDate.trim() ? endDate.trim() : null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? '新建资料片' : '编辑资料片'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? '填写资料片名称、等级、描述及日期范围以创建新记录。'
              : '修改资料片信息后保存。'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="expansion-name">资料片名称</Label>
            <Input
              id="expansion-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="expansion-level">资料片等级</Label>
            <Input
              id="expansion-level"
              type="number"
              min={1}
              value={level}
              onChange={(event) => setLevel(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="expansion-description">描述</Label>
            <Textarea
              id="expansion-description"
              value={description}
              placeholder="可选，填写资料片描述"
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="expansion-start-date">起始日期</Label>
            <Input
              id="expansion-start-date"
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="expansion-end-date">终止日期</Label>
            <Input
              id="expansion-end-date"
              type="date"
              value={endDate}
              placeholder="可选"
              onChange={(event) => setEndDate(event.target.value)}
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
            disabled={pending || !isValid}
            onClick={handleSubmit}
          >
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
