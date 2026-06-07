import { describe, expect, it, vi } from 'vitest';
import {
  formatAliasInput,
  parseAliasInput,
} from '../../../../src/lib/api/admin/schools-admin-api';
import { ApiRequestError } from '../../../../src/lib/api/request';

describe('school alias helpers', () => {
  it('parses comma-separated aliases', () => {
    expect(parseAliasInput('天策府，天策')).toEqual(['天策府', '天策']);
  });

  it('formats aliases for input display', () => {
    expect(formatAliasInput(['天策府', '天策'])).toBe('天策府，天策');
  });
});

describe('schoolsAdminApi', () => {
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

    const { schoolsAdminApi } = await import(
      '../../../../src/lib/api/admin/schools-admin-api'
    );

    await expect(
      schoolsAdminApi.list({ page: 1, pageSize: 20 }),
    ).rejects.toThrow(ApiRequestError);

    vi.unstubAllGlobals();
  });
});
