import { createFileRoute } from '@tanstack/react-router';
import { raidRunsApi } from '#/lib/api/raid-runs-api';
import { CreateRaidComponent } from '../-components/CreateRaidComponent';

export const Route = createFileRoute('/_app/raids/create/$raidRunId/')({
  loader: async ({ params }) => raidRunsApi.get(params.raidRunId),
  component: EditRaidDraftPage,
});

function EditRaidDraftPage() {
  const initialData = Route.useLoaderData();
  const { raidRunId } = Route.useParams();

  return (
    <CreateRaidComponent
      mode="draft"
      raidRunId={raidRunId}
      initialData={initialData}
    />
  );
}
