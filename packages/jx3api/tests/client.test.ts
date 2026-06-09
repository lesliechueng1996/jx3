import { afterEach, describe, expect, it, mock } from 'bun:test';
import { fetchJson } from '../src/client';
import { Jx3ApiError } from '../src/errors';
import { stubGlobalFetch } from './helpers/mock-fetch';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  mock.restore();
});

describe('fetchJson', () => {
  it('returns parsed JSON on success', async () => {
    stubGlobalFetch(() =>
      Promise.resolve(
        new Response(JSON.stringify({ ok: true }), { status: 200 }),
      ),
    );

    const result = await fetchJson<{ ok: boolean }>('https://example.com');

    expect(result).toEqual({ ok: true });
  });

  it('throws Jx3ApiError on non-2xx response', async () => {
    stubGlobalFetch(() =>
      Promise.resolve(new Response('not found', { status: 404 })),
    );

    await expect(fetchJson('https://example.com')).rejects.toMatchObject({
      name: 'Jx3ApiError',
      code: 'HTTP_ERROR',
      status: 404,
    });
  });

  it('throws Jx3ApiError on network failure', async () => {
    stubGlobalFetch(() => Promise.reject(new Error('connection refused')));

    await expect(fetchJson('https://example.com')).rejects.toBeInstanceOf(
      Jx3ApiError,
    );
  });

  it('throws Jx3ApiError on invalid JSON', async () => {
    stubGlobalFetch(() =>
      Promise.resolve(new Response('not-json', { status: 200 })),
    );

    await expect(fetchJson('https://example.com')).rejects.toMatchObject({
      code: 'PARSE_ERROR',
    });
  });
});
