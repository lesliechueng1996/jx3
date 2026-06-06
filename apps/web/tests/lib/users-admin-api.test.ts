import { describe, expect, it, vi } from 'vitest';
import { maskEmail } from '../../src/lib/mask-email';

describe('maskEmail', () => {
  it('masks email addresses consistently', () => {
    expect(maskEmail('test@example.com')).toBe('t***@example.com');
  });
});

describe('usersAdminApi', () => {
  it('throws ApiRequestError for failed responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        Response.json(
          { error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
          { status: 403 },
        ),
      ),
    );

    const { usersAdminApi, ApiRequestError } = await import(
      '../../src/lib/users-admin-api'
    );

    await expect(usersAdminApi.list({ page: 1, pageSize: 20 })).rejects.toThrow(
      ApiRequestError,
    );

    vi.unstubAllGlobals();
  });
});
