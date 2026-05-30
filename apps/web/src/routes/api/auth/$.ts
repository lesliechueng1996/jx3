import { createFileRoute } from '@tanstack/react-router';
import { proxyAuth } from '#/lib/proxy';

const handle = ({
  request,
  params,
}: {
  request: Request;
  params: { _splat?: string };
}) => proxyAuth(request, params._splat ?? '');

export const Route = createFileRoute('/api/auth/$')({
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
