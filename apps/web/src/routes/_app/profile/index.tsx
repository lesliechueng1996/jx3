import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/profile/')({
  component: ProfilePage,
});

function ProfilePage() {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">个人中心</h1>
      <p className="text-sm text-muted-foreground">
        功能开发中，敬请期待。
      </p>
    </div>
  );
}
