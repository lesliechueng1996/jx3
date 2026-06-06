const API_URL = process.env.API_URL ?? 'http://localhost:3001';

export function buildApiV1UpstreamRequest(
  request: Request,
  splat: string,
  apiUrl: string = API_URL,
): Request {
  const incoming = new URL(request.url);
  const target = new URL(`/api/v1/${splat}`, apiUrl);
  target.search = incoming.search;

  return new Request(target, {
    method: request.method,
    headers: request.headers,
    body: request.body,
    redirect: 'manual',
    ...(request.body ? { duplex: 'half' } : {}),
  } as RequestInit);
}

export async function proxyApiV1(
  request: Request,
  splat: string,
): Promise<Response> {
  const upstream = buildApiV1UpstreamRequest(request, splat);
  return fetch(upstream);
}
