import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  type AdminGameItemListItem,
  formatAliasInput,
  type GameItemFormValues,
  ITEM_QUALITIES,
  ITEM_QUALITY_LABELS,
  ITEM_TYPE_LABELS,
  ITEM_TYPES,
  type ItemQuality,
  type ItemType,
  parseAliasInput,
} from '#/lib/api/admin/game-items-admin-api';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

type ItemFormDialogComponentProps = {
  item: AdminGameItemListItem | null;
  mode: 'create' | 'edit';
  open: boolean;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: GameItemFormValues) => void;
};

const emptyForm = (): GameItemFormValues => ({
  name: '',
  type: 'equipment',
  quality: 'purple',
  gameItemId: null,
  description: null,
  icon: null,
  alias: [],
});

export function ItemFormDialogComponent({
  item,
  mode,
  open,
  pending,
  onOpenChange,
  onSubmit,
}: ItemFormDialogComponentProps) {
  const [form, setForm] = useState<GameItemFormValues>(emptyForm);
  const [gameItemIdInput, setGameItemIdInput] = useState('');
  const [descriptionInput, setDescriptionInput] = useState('');
  const [iconInput, setIconInput] = useState('');
  const [aliasInput, setAliasInput] = useState('');

  useEffect(() => {
    if (mode === 'edit' && item) {
      setForm({
        name: item.name,
        type: item.type,
        quality: item.quality,
        gameItemId: item.gameItemId,
        description: item.description,
        icon: item.icon,
        alias: item.alias,
      });
      setGameItemIdInput(item.gameItemId ?? '');
      setDescriptionInput(item.description ?? '');
      setIconInput(item.icon ?? '');
      setAliasInput(formatAliasInput(item.alias));
      return;
    }

    if (mode === 'create') {
      const defaults = emptyForm();
      setForm(defaults);
      setGameItemIdInput('');
      setDescriptionInput('');
      setIconInput('');
      setAliasInput('');
    }
  }, [item, mode]);

  const handleSubmit = () => {
    onSubmit({
      ...form,
      name: form.name.trim(),
      gameItemId: gameItemIdInput.trim() ? gameItemIdInput.trim() : null,
      description: descriptionInput.trim() ? descriptionInput.trim() : null,
      icon: iconInput.trim() ? iconInput.trim() : null,
      alias: parseAliasInput(aliasInput),
    });
  };

  const isValid = form.name.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? '新建物品' : '编辑物品'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? '填写物品基础信息并保存。'
              : '修改物品信息后保存。'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="item-name">物品名称</Label>
            <Input
              id="item-name"
              value={form.name}
              placeholder="请输入物品名称"
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>类型</Label>
              <Select
                value={form.type}
                onValueChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    type: value as ItemType,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ITEM_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {ITEM_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>品质</Label>
              <Select
                value={form.quality}
                onValueChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    quality: value as ItemQuality,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ITEM_QUALITIES.map((quality) => (
                    <SelectItem key={quality} value={quality}>
                      {ITEM_QUALITY_LABELS[quality]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="item-game-id">游戏内物品 ID</Label>
            <Input
              id="item-game-id"
              value={gameItemIdInput}
              placeholder="可选，填写游戏内物品 ID"
              onChange={(event) => setGameItemIdInput(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="item-icon">图标 URL</Label>
            <Input
              id="item-icon"
              value={iconInput}
              placeholder="可选，填写图标地址"
              onChange={(event) => setIconInput(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="item-description">描述</Label>
            <Textarea
              id="item-description"
              value={descriptionInput}
              placeholder="可选，填写物品描述"
              rows={3}
              onChange={(event) => setDescriptionInput(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              常用间隔号：
              <button
                type="button"
                disabled={pending}
                className="mx-0.5 rounded border bg-muted px-1.5 py-0.5 font-mono hover:bg-muted/80 disabled:opacity-50"
                onClick={() => {
                  void navigator.clipboard
                    .writeText('·')
                    .then(() => toast.success('已复制'))
                    .catch(() => toast.error('复制失败'));
                }}
              >
                ·
              </button>
              点击复制，或手动选中后复制
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="item-alias">别称</Label>
            <Input
              id="item-alias"
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
            disabled={pending}
            onClick={() => onOpenChange(false)}
          >
            取消
          </Button>
          <Button
            type="button"
            disabled={!isValid || pending}
            onClick={handleSubmit}
          >
            {pending ? '保存中…' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
