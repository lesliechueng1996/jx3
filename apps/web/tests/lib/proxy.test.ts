import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildUpstreamRequest, proxyAuth } from '../../src/lib/proxy';

describe('buildUpstreamRequest', () => {
  it('forwards method, headers, and splat path to the API', () => {
    const request = new Request(
      'http://localhost:3000/api/auth/sign-in/email',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: 'session=abc' },
        body: JSON.stringify({ email: 'a@b.com' }),
      },
    );

    const upstream = buildUpstreamRequest(
      request,
      'sign-in/email',
      'http://localhost:3001',
    );

    expect(upstream.url).toBe('http://localhost:3001/api/auth/sign-in/email');
    expect(upstream.method).toBe('POST');
    expect(upstream.headers.get('Content-Type')).toBe('application/json');
    expect(upstream.headers.get('Cookie')).toBe('session=abc');
  });

  it('preserves query string from the incoming request', () => {
    const request = new Request(
      'http://localhost:3000/api/auth/callback/github?code=xyz',
    );

    const upstream = buildUpstreamRequest(
      request,
      'callback/github',
      'http://localhost:3001',
    );

    expect(upstream.url).toBe(
      'http://localhost:3001/api/auth/callback/github?code=xyz',
    );
  });
});

describe('proxyAuth', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn(async () => new Response('ok', { status: 200 }));
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('delegates to fetch with the upstream request', async () => {
    const request = new Request('http://localhost:3000/api/auth/get-session');

    const response = await proxyAuth(request, 'get-session');

    expect(globalThis.fetch).toHaveBeenCalledOnce();
    const calledWith = vi.mocked(globalThis.fetch).mock.calls[0]?.[0];
    expect(calledWith).toBeInstanceOf(Request);
    expect((calledWith as Request).url).toBe(
      'http://localhost:3001/api/auth/get-session',
    );
    expect(response.status).toBe(200);
  });
});
