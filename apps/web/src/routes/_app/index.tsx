import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/')({
  component: HomePage,
});

function HomePage() {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">欢迎</h1>
      <p className="text-muted-foreground">
        请从左侧菜单进入「我的角色」「我要开团」或「参团记录」。
      </p>
    </div>
  );
}
