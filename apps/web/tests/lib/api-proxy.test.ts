import { describe, expect, it } from 'vitest';
import { buildApiV1UpstreamRequest } from '../../src/lib/api-proxy';

describe('buildApiV1UpstreamRequest', () => {
  it('forwards method, body, and query to the API server', () => {
    const request = new Request('http://localhost:3000/api/v1/users?page=2', {
      method: 'GET',
      headers: { cookie: 'session=abc' },
    });

    const upstream = buildApiV1UpstreamRequest(
      request,
      'users?page=2',
      'http://localhost:3001',
    );

    expect(upstream.method).toBe('GET');
    expect(upstream.url).toBe('http://localhost:3001/api/v1/users?page=2');
    expect(upstream.headers.get('cookie')).toBe('session=abc');
  });
});
