import {
  buildUpstreamProxyRequest,
  proxyUpstream,
} from '#/lib/api/upstream-proxy';

export function buildUpstreamRequest(
  request: Request,
  splat: string,
  apiUrl?: string,
): Request {
  return buildUpstreamProxyRequest(request, splat, '/api/auth', apiUrl);
}

export async function proxyAuth(
  request: Request,
  splat: string,
): Promise<Response> {
  return proxyUpstream(request, splat, '/api/auth');
}
