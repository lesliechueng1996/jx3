import { createFileRoute } from '@tanstack/react-router';
import { proxyApiV1 } from '#/lib/api-proxy';

const handle = ({
  request,
  params,
}: {
  request: Request;
  params: { _splat?: string };
}) => proxyApiV1(request, params._splat ?? '');

export const Route = createFileRoute('/api/v1/$')({
  server: {
    handlers: {
      GET: handle,
      POST: handle,
      PUT: handle,
      PATCH: handle,
      DELETE: handle,
      OPTIONS: handle,
    },
  },
});
