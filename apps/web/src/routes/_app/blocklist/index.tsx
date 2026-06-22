import { createFileRoute } from '@tanstack/react-router';
import { BlocklistComponent } from './-components/BlocklistComponent';

export const Route = createFileRoute('/_app/blocklist/')({
  component: BlocklistPage,
});

function BlocklistPage() {
  return <BlocklistComponent />;
}
