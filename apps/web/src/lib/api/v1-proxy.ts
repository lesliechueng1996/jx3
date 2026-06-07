import {
  buildUpstreamProxyRequest,
  proxyUpstream,
} from '#/lib/api/upstream-proxy';

export function buildApiV1UpstreamRequest(
  request: Request,
  splat: string,
  apiUrl?: string,
): Request {
  return buildUpstreamProxyRequest(request, splat, '/api/v1', apiUrl);
}

export async function proxyApiV1(
  request: Request,
  splat: string,
): Promise<Response> {
  return proxyUpstream(request, splat, '/api/v1');
}
