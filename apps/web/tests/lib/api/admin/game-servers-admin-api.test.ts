import { describe, expect, it, vi } from 'vitest';
import {
  formatAliasInput,
  parseAliasInput,
} from '../../../../src/lib/api/admin/game-servers-admin-api';
import { ApiRequestError } from '../../../../src/lib/api/request';

describe('game server alias helpers', () => {
  it('parses comma-separated aliases', () => {
    expect(parseAliasInput('幽月，幽月轮')).toEqual(['幽月', '幽月轮']);
  });

  it('formats aliases for input display', () => {
    expect(formatAliasInput(['幽月', '幽月轮'])).toBe('幽月，幽月轮');
  });
});

describe('gameServersAdminApi', () => {
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

    const { gameServersAdminApi } = await import(
      '../../../../src/lib/api/admin/game-servers-admin-api'
    );

    await expect(gameServersAdminApi.list()).rejects.toThrow(ApiRequestError);

    vi.unstubAllGlobals();
  });
});
