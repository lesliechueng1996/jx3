import { useMutation } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import type {
  CreateGameItemPayload,
  GameItemResponse,
} from '#/lib/api/game-items-api';
import type { RaidLootItem, RaidSignupResponse } from '#/lib/api/raid-runs-api';
import { ApiRequestError } from '#/lib/api/request';
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
import { CreateGameItemFieldsComponent } from './CreateGameItemFieldsComponent';
import { ItemSearchFieldComponent } from './ItemSearchFieldComponent';
import { ITEM_QUALITY_CLASS, ITEM_QUALITY_LABELS } from './item-utils';

type AddLootDialogComponentProps = {
  open: boolean;
  mode: 'create' | 'edit';
  raidRunId: string;
  loot: RaidLootItem | null;
  signups: RaidSignupResponse[];
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: {
    itemId: string;
    quantity: number;
    winnerSignupId: string | null;
    price: number | null;
    remark: string | null;
  }) => void;
  onCreateItem: (item: CreateGameItemPayload) => Promise<GameItemResponse>;
};

const NONE_WINNER = '__none__';

export function AddLootDialogComponent({
  open,
  mode,
  loot,
  signups,
  pending,
  onOpenChange,
  onSubmit,
  onCreateItem,
}: AddLootDialogComponentProps) {
  const [selectedItem, setSelectedItem] = useState<GameItemResponse | null>(
    null,
  );
  const [quantityInput, setQuantityInput] = useState('1');
  const [winnerSignupId, setWinnerSignupId] = useState<string>(NONE_WINNER);
  const [priceInput, setPriceInput] = useState('');
  const [remark, setRemark] = useState('');
  const [showCreateItem, setShowCreateItem] = useState(false);
  const [createItemName, setCreateItemName] = useState('');

  const winnerOptions = useMemo(
    () =>
      signups
        .filter((signup) => signup.characterName?.trim())
        .sort((left, right) => {
          const leftGroup = left.groupNumber ?? 0;
          const rightGroup = right.groupNumber ?? 0;
          if (leftGroup !== rightGroup) {
            return leftGroup - rightGroup;
          }
          return (left.positionNumber ?? 0) - (right.positionNumber ?? 0);
        }),
    [signups],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    if (mode === 'edit' && loot) {
      setSelectedItem({
        id: loot.itemId,
        name: loot.itemName,
        type: 'special',
        quality: loot.itemQuality,
        gameItemId: null,
        description: null,
        icon: loot.itemIcon,
        alias: [],
        createdAt: loot.createdAt,
        updatedAt: loot.updatedAt,
      });
      setQuantityInput(String(loot.quantity));
      setWinnerSignupId(loot.winnerSignupId ?? NONE_WINNER);
      setPriceInput(loot.price === null ? '' : String(loot.price));
      setRemark(loot.remark ?? '');
      setShowCreateItem(false);
      setCreateItemName('');
      return;
    }

    setSelectedItem(null);
    setQuantityInput('1');
    setWinnerSignupId(NONE_WINNER);
    setPriceInput('');
    setRemark('');
    setShowCreateItem(false);
    setCreateItemName('');
  }, [loot, mode, open]);

  const handleSubmit = () => {
    if (!selectedItem) {
      toast.error('请选择物品');
      return;
    }

    const quantity = Number.parseInt(quantityInput, 10);
    if (!Number.isFinite(quantity) || quantity < 1) {
      toast.error('数量至少为 1');
      return;
    }

    const price =
      priceInput.trim() === '' ? null : Number.parseInt(priceInput, 10);
    if (price !== null && (!Number.isFinite(price) || price < 0)) {
      toast.error('成交价必须为非负整数');
      return;
    }

    onSubmit({
      itemId: selectedItem.id,
      quantity,
      winnerSignupId: winnerSignupId === NONE_WINNER ? null : winnerSignupId,
      price,
      remark: remark.trim() ? remark.trim() : null,
    });
  };

  const createItemMutation = useMutation({
    mutationFn: onCreateItem,
    onSuccess: (item) => {
      setSelectedItem(item);
      setShowCreateItem(false);
      toast.success('物品已创建');
    },
    onError: (error) => {
      if (error instanceof ApiRequestError) {
        toast.error(error.message);
        return;
      }
      toast.error('创建物品失败');
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? '添加掉落' : '编辑掉落'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? '记录副本中的重要掉落，获得者和成交价可稍后再填。'
              : '更新掉落物品的获得者、成交价等信息。'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {mode === 'create' ? (
            <>
              <ItemSearchFieldComponent
                selectedItem={selectedItem}
                disabled={pending}
                onSelect={setSelectedItem}
                onCreateRequest={(name) => {
                  setCreateItemName(name);
                  setShowCreateItem(true);
                }}
              />
              {showCreateItem ? (
                <CreateGameItemFieldsComponent
                  initialName={createItemName}
                  pending={createItemMutation.isPending}
                  onCancel={() => setShowCreateItem(false)}
                  onSubmit={(values) => createItemMutation.mutate(values)}
                />
              ) : null}
            </>
          ) : selectedItem ? (
            <div className="rounded-md border px-3 py-2 text-sm">
              <span className={ITEM_QUALITY_CLASS[selectedItem.quality]}>
                [{ITEM_QUALITY_LABELS[selectedItem.quality]}]
              </span>{' '}
              {selectedItem.name}
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="loot-quantity">数量</Label>
            <Input
              id="loot-quantity"
              inputMode="numeric"
              disabled={pending}
              value={quantityInput}
              onChange={(event) => setQuantityInput(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>获得者</Label>
            <Select
              disabled={pending}
              value={winnerSignupId}
              onValueChange={setWinnerSignupId}
            >
              <SelectTrigger>
                <SelectValue placeholder="暂不指定" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_WINNER}>暂不指定</SelectItem>
                {winnerOptions.map((signup) => (
                  <SelectItem key={signup.id} value={signup.id}>
                    {signup.characterName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="loot-price">成交价（金）</Label>
            <Input
              id="loot-price"
              inputMode="numeric"
              disabled={pending}
              value={priceInput}
              onChange={(event) => setPriceInput(event.target.value)}
              placeholder="可选"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="loot-remark">备注</Label>
            <Textarea
              id="loot-remark"
              disabled={pending}
              value={remark}
              onChange={(event) => setRemark(event.target.value)}
              placeholder="可选"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            disabled={pending}
            onClick={() => onOpenChange(false)}
          >
            取消
          </Button>
          <Button disabled={pending} onClick={handleSubmit}>
            {pending ? '保存中…' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
