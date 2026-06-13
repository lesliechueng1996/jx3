import { useEffect, useState } from 'react';
import type {
  AdminSeasonListItem,
  SeasonFormValues,
} from '#/lib/api/admin/seasons-admin-api';
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

type SeasonFormDialogComponentProps = {
  season: AdminSeasonListItem | null;
  mode: 'create' | 'edit';
  open: boolean;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: SeasonFormValues) => void;
};

const emptyForm = (): SeasonFormValues => ({
  name: '',
  description: null,
  startDate: '',
  endDate: null,
  sortOrder: 0,
});

export function SeasonFormDialogComponent({
  season,
  mode,
  open,
  pending,
  onOpenChange,
  onSubmit,
}: SeasonFormDialogComponentProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortOrder, setSortOrder] = useState('0');

  useEffect(() => {
    if (mode === 'edit' && season) {
      setName(season.name);
      setDescription(season.description ?? '');
      setStartDate(season.startDate);
      setEndDate(season.endDate ?? '');
      setSortOrder(String(season.sortOrder));
      return;
    }

    if (mode === 'create') {
      const defaults = emptyForm();
      setName(defaults.name);
      setDescription('');
      setStartDate(defaults.startDate);
      setEndDate('');
      setSortOrder(String(defaults.sortOrder));
    }
  }, [mode, season]);

  const parsedSortOrder = Number.parseInt(sortOrder, 10);
  const isValid =
    name.trim().length > 0 &&
    startDate.length > 0 &&
    Number.isInteger(parsedSortOrder) &&
    parsedSortOrder >= 0;

  const handleSubmit = () => {
    if (!isValid) {
      return;
    }

    onSubmit({
      name: name.trim(),
      description: description.trim() ? description.trim() : null,
      startDate,
      endDate: endDate.trim() ? endDate.trim() : null,
      sortOrder: parsedSortOrder,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? '新建赛季' : '编辑赛季'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? '填写赛季名称、描述及日期范围以创建新记录。'
              : '修改赛季信息后保存。'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="season-name">赛季名称</Label>
            <Input
              id="season-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="season-description">描述</Label>
            <Textarea
              id="season-description"
              value={description}
              placeholder="可选，填写赛季描述"
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="season-start-date">起始日期</Label>
            <Input
              id="season-start-date"
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="season-end-date">终止日期</Label>
            <Input
              id="season-end-date"
              type="date"
              value={endDate}
              placeholder="可选"
              onChange={(event) => setEndDate(event.target.value)}
            />
          </div>
          {mode === 'edit' ? (
            <div className="space-y-2">
              <Label htmlFor="season-sort-order">排序</Label>
              <Input
                id="season-sort-order"
                type="number"
                min={0}
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value)}
              />
            </div>
          ) : null}
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
