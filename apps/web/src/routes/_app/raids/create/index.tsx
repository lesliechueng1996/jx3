import { createFileRoute } from '@tanstack/react-router';
import { CreateRaidComponent } from './-components/CreateRaidComponent';

export const Route = createFileRoute('/_app/raids/create/')({
  component: CreateRaidPage,
});

function CreateRaidPage() {
  return <CreateRaidComponent mode="create" />;
}
