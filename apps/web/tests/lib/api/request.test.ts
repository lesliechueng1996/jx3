import { describe, expect, it } from 'vitest';
import { resolveRequestUrl } from '../../../src/lib/api/request';

describe('resolveRequestUrl', () => {
  it('returns absolute URLs unchanged', () => {
    expect(resolveRequestUrl('https://example.com/api/v1/me')).toBe(
      'https://example.com/api/v1/me',
    );
  });

  it('resolves relative API paths against a base origin', () => {
    expect(
      resolveRequestUrl('/api/v1/raid-runs/run-1', 'http://localhost:3000'),
    ).toBe('http://localhost:3000/api/v1/raid-runs/run-1');
  });
});
