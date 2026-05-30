const API_URL = process.env.API_URL ?? 'http://localhost:3001';

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
  return fetch(buildUpstreamRequest(request, splat));
}
