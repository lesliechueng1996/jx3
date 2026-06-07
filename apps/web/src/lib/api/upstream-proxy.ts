const API_URL = process.env.API_URL ?? 'http://localhost:3001';

export function buildUpstreamProxyRequest(
  request: Request,
  splat: string,
  pathPrefix: string,
  apiUrl: string = API_URL,
): Request {
  const incoming = new URL(request.url);
  const target = new URL(`${pathPrefix}/${splat}`, apiUrl);
  target.search = incoming.search;

  return new Request(target, {
    method: request.method,
    headers: request.headers,
    body: request.body,
    redirect: 'manual',
    ...(request.body ? { duplex: 'half' } : {}),
  } as RequestInit);
}

export async function proxyUpstream(
  request: Request,
  splat: string,
  pathPrefix: string,
): Promise<Response> {
  const upstream = buildUpstreamProxyRequest(request, splat, pathPrefix);
  return fetch(upstream);
}
