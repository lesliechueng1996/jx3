import { Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';

type TableLoadingOverlayComponentProps = {
  loading: boolean;
  className?: string;
};

export function TableLoadingOverlayComponent({
  loading,
  className,
}: TableLoadingOverlayComponentProps) {
  if (!loading) {
    return null;
  }

  return (
    <div
      className={cn(
        'absolute inset-0 z-10 flex min-h-40 items-center justify-center gap-2 bg-background/60',
        className,
      )}
      aria-busy="true"
      aria-live="polite"
    >
      <Loader2 className="size-5 animate-spin text-muted-foreground" />
      <span className="text-sm text-muted-foreground">加载中...</span>
    </div>
  );
}
