import { describe, expect, it } from 'vitest';
import { toRouteSearch } from '../../../../src/routes/_app/admin/-components/admin-list-search';

describe('toRouteSearch', () => {
  const defaults = {
    page: 1,
    pageSize: 10,
  };

  it('includes non-default filter fields', () => {
    expect(
      toRouteSearch(
        { page: 1, pageSize: 10, name: 'test', role: 'admin' },
        defaults,
      ),
    ).toEqual({
      name: 'test',
      role: 'admin',
    });
  });

  it('clears removed filter fields', () => {
    expect(
      toRouteSearch({ page: 1, pageSize: 10, name: undefined }, defaults),
    ).toEqual({
      name: undefined,
    });
  });

  it('includes non-default pagination', () => {
    expect(toRouteSearch({ page: 2, pageSize: 10 }, defaults)).toEqual({
      page: 2,
    });
  });
});
