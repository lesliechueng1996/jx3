import { createFileRoute } from '@tanstack/react-router';
import { zodValidator } from '@tanstack/zod-adapter';
import { z } from 'zod';
import { RaidHistoryComponent } from './-components/RaidHistoryComponent';

const raidHistorySearchSchema = z.object({
  filter: z.enum(['all', 'created', 'leader']).default('all'),
});

export const Route = createFileRoute('/_app/raids/history/')({
  validateSearch: zodValidator(raidHistorySearchSchema),
  component: RaidHistoryPage,
});

function RaidHistoryPage() {
  return <RaidHistoryComponent />;
}
