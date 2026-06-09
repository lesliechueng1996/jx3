import { afterEach, describe, expect, it, mock } from 'bun:test';
import { fetchJson } from '../src/client';
import { Jx3ApiError } from '../src/errors';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  mock.restore();
});

describe('fetchJson', () => {
  it('returns parsed JSON on success', async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response(JSON.stringify({ ok: true }), { status: 200 }),
      ),
    ) as typeof fetch;

    const result = await fetchJson<{ ok: boolean }>('https://example.com');

    expect(result).toEqual({ ok: true });
  });

  it('throws Jx3ApiError on non-2xx response', async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(new Response('not found', { status: 404 })),
    ) as typeof fetch;

    await expect(fetchJson('https://example.com')).rejects.toMatchObject({
      name: 'Jx3ApiError',
      code: 'HTTP_ERROR',
      status: 404,
    });
  });

  it('throws Jx3ApiError on network failure', async () => {
    globalThis.fetch = mock(() =>
      Promise.reject(new Error('connection refused')),
    ) as typeof fetch;

    await expect(fetchJson('https://example.com')).rejects.toBeInstanceOf(
      Jx3ApiError,
    );
  });

  it('throws Jx3ApiError on invalid JSON', async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(new Response('not-json', { status: 200 })),
    ) as typeof fetch;

    await expect(fetchJson('https://example.com')).rejects.toMatchObject({
      code: 'PARSE_ERROR',
    });
  });
});
