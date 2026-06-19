import { useState } from 'react';
import type { CreateGameItemPayload } from '#/lib/api/game-items-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ITEM_QUALITY_LABELS,
  ITEM_TYPE_LABELS,
  type ItemQuality,
  type ItemType,
} from './item-utils';

type CreateGameItemFieldsComponentProps = {
  initialName: string;
  pending?: boolean;
  onCancel: () => void;
  onSubmit: (values: CreateGameItemPayload) => void;
};

export function CreateGameItemFieldsComponent({
  initialName,
  pending = false,
  onCancel,
  onSubmit,
}: CreateGameItemFieldsComponentProps) {
  const [name, setName] = useState(initialName);
  const [type, setType] = useState<ItemType>('equipment');
  const [quality, setQuality] = useState<ItemQuality>('purple');

  return (
    <div className="space-y-3 rounded-md border border-dashed p-3">
      <p className="text-sm font-medium">创建新物品</p>
      <div className="space-y-2">
        <Label htmlFor="create-item-name">物品名称</Label>
        <Input
          id="create-item-name"
          disabled={pending}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>类型</Label>
          <Select
            disabled={pending}
            value={type}
            onValueChange={(value) => setType(value as ItemType)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(ITEM_TYPE_LABELS) as ItemType[]).map((key) => (
                <SelectItem key={key} value={key}>
                  {ITEM_TYPE_LABELS[key]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>品质</Label>
          <Select
            disabled={pending}
            value={quality}
            onValueChange={(value) => setQuality(value as ItemQuality)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(ITEM_QUALITY_LABELS) as ItemQuality[]).map(
                (key) => (
                  <SelectItem key={key} value={key}>
                    {ITEM_QUALITY_LABELS[key]}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={onCancel}
        >
          取消
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={pending || !name.trim()}
          onClick={() =>
            onSubmit({
              name: name.trim(),
              type,
              quality,
            })
          }
        >
          {pending ? '创建中…' : '创建并选择'}
        </Button>
      </div>
    </div>
  );
}
