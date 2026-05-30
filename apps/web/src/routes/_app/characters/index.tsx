import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/characters/')({
  component: CharactersPage,
});

function CharactersPage() {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">我的角色</h1>
      <p className="text-sm text-muted-foreground">
        routes/_app/characters/index.tsx
      </p>
    </div>
  );
}
