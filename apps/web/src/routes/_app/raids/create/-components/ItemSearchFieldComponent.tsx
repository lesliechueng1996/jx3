import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import {
  type GameItemResponse,
  gameItemsApi,
  gameItemsQueryKey,
} from '#/lib/api/game-items-api';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { ITEM_QUALITY_CLASS, ITEM_QUALITY_LABELS } from './item-utils';

type ItemSearchFieldComponentProps = {
  selectedItem: GameItemResponse | null;
  disabled?: boolean;
  onSelect: (item: GameItemResponse | null) => void;
  onCreateRequest: (name: string) => void;
};

export function ItemSearchFieldComponent({
  selectedItem,
  disabled = false,
  onSelect,
  onCreateRequest,
}: ItemSearchFieldComponentProps) {
  const [search, setSearch] = useState('');
  const [showResults, setShowResults] = useState(false);

  const itemsQuery = useQuery({
    queryKey: [...gameItemsQueryKey, 'search', search],
    queryFn: () => gameItemsApi.search(search),
    enabled: showResults && search.trim().length > 0,
  });

  const results = itemsQuery.data?.items ?? [];
  const trimmedSearch = search.trim();

  return (
    <div className="space-y-2">
      <Label htmlFor="loot-item-search">物品</Label>
      <Input
        id="loot-item-search"
        disabled={disabled}
        value={selectedItem?.name ?? search}
        onChange={(event) => {
          setSearch(event.target.value);
          setShowResults(true);
          if (selectedItem) {
            onSelect(null);
          }
        }}
        onFocus={() => setShowResults(true)}
        placeholder="搜索物品名称"
      />
      {showResults && trimmedSearch ? (
        <div className="max-h-48 overflow-y-auto rounded-md border bg-background shadow-sm">
          {itemsQuery.isLoading ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">搜索中…</p>
          ) : null}
          {!itemsQuery.isLoading && results.length === 0 ? (
            <button
              type="button"
              className="block w-full px-3 py-2 text-left text-sm hover:bg-muted"
              onClick={() => {
                onCreateRequest(trimmedSearch);
                setShowResults(false);
              }}
            >
              创建物品「{trimmedSearch}」
            </button>
          ) : null}
          {results.map((item) => (
            <button
              key={item.id}
              type="button"
              className={cn(
                'block w-full px-3 py-2 text-left text-sm hover:bg-muted',
                selectedItem?.id === item.id && 'bg-muted',
              )}
              onClick={() => {
                onSelect(item);
                setSearch(item.name);
                setShowResults(false);
              }}
            >
              <span className={ITEM_QUALITY_CLASS[item.quality]}>
                [{ITEM_QUALITY_LABELS[item.quality]}]
              </span>{' '}
              {item.name}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
