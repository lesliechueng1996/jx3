import { logger } from '#/lib/logger';

const API_URL = process.env.API_URL ?? 'http://localhost:3001';
const proxyLog = logger.child({ module: 'proxy' });

export function buildUpstreamRequest(
  request: Request,
  splat: string,
  apiUrl: string = API_URL,
): Request {
  const incoming = new URL(request.url);
  const target = new URL(`/api/auth/${splat}`, apiUrl);
  target.search = incoming.search;

  return new Request(target, {
    method: request.method,
    headers: request.headers,
    body: request.body,
    redirect: 'manual',
    // duplex is required when streaming a request body
    ...(request.body ? { duplex: 'half' } : {}),
  } as RequestInit);
}

export async function proxyAuth(
  request: Request,
  splat: string,
): Promise<Response> {
  const upstream = buildUpstreamRequest(request, splat);
  proxyLog.debug(
    { method: request.method, path: `/api/auth/${splat}` },
    'proxying auth request',
  );

  const response = await fetch(upstream);
  proxyLog.debug(
    {
      method: request.method,
      path: `/api/auth/${splat}`,
      status: response.status,
    },
    'auth proxy response',
  );

  return response;
}
