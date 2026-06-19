import { describe, expect, it } from 'vitest';
import { matchesOptionSearch } from '#/routes/_app/raids/create/-components/searchable-option-utils';

describe('matchesOptionSearch', () => {
  it('matches primary names and aliases case-insensitively', () => {
    expect(
      matchesOptionSearch('双梦', ['电信区', '梦江南', '双梦镇', '双梦']),
    ).toBe(true);
  });

  it('returns all items when query is empty', () => {
    expect(matchesOptionSearch('', ['傲血战意'])).toBe(true);
  });

  it('returns false when nothing matches', () => {
    expect(matchesOptionSearch('不存在', ['傲血战意'])).toBe(false);
  });
});
