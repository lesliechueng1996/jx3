import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/raids/history/')({
  component: RaidHistoryPage,
});

function RaidHistoryPage() {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">参团记录</h1>
      <p className="text-sm text-muted-foreground">
        routes/_app/raids/history/index.tsx
      </p>
    </div>
  );
}
