import { describe, expect, it, vi } from 'vitest';
import {
  emptyFormationEffectInputs,
  formatAliasInput,
  formatBooleanLabel,
  parseAliasInput,
  parseFormationEffectInput,
  serializeFormationEffectInput,
} from '../../../../src/lib/api/admin/kungfu-admin-api';
import { ApiRequestError } from '../../../../src/lib/api/request';

describe('kungfu alias helpers', () => {
  it('parses comma-separated aliases', () => {
    expect(parseAliasInput('傲血，战意')).toEqual(['傲血', '战意']);
  });

  it('formats aliases for input display', () => {
    expect(formatAliasInput(['傲血', '战意'])).toBe('傲血，战意');
  });
});

describe('formation effect helpers', () => {
  it('returns six empty lines when value is null', () => {
    expect(emptyFormationEffectInputs()).toEqual(['', '', '', '', '', '']);
    expect(parseFormationEffectInput(null)).toEqual(
      emptyFormationEffectInputs(),
    );
  });

  it('splits stored value by newline into six inputs', () => {
    expect(parseFormationEffectInput('第一重效果\n第二重效果')).toEqual([
      '第一重效果',
      '第二重效果',
      '',
      '',
      '',
      '',
    ]);
  });

  it('joins six inputs with newline for submit', () => {
    expect(
      serializeFormationEffectInput([
        '第一重效果',
        '',
        '第三重效果',
        '',
        '',
        '',
      ]),
    ).toBe('第一重效果\n\n第三重效果\n\n\n');
  });

  it('returns null when all six inputs are empty', () => {
    expect(
      serializeFormationEffectInput(emptyFormationEffectInputs()),
    ).toBeNull();
  });
});

describe('formatBooleanLabel', () => {
  it('returns Chinese labels for booleans', () => {
    expect(formatBooleanLabel(true)).toBe('是');
    expect(formatBooleanLabel(false)).toBe('否');
  });
});

describe('kungfuAdminApi', () => {
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

    const { kungfuAdminApi } = await import(
      '../../../../src/lib/api/admin/kungfu-admin-api'
    );

    await expect(
      kungfuAdminApi.list({ page: 1, pageSize: 20 }),
    ).rejects.toThrow(ApiRequestError);

    vi.unstubAllGlobals();
  });
});
