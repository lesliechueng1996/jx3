import { beforeEach, describe, expect, it, vi } from 'vitest';

const getSessionFn = vi.fn();

vi.mock('../../../src/lib/auth/get-session', () => ({
  getSessionFn: () => getSessionFn(),
}));

import {
  clearCachedSession,
  getCachedSession,
  sessionQueryKey,
} from '../../../src/lib/auth/session-query';
import { queryClient } from '../../../src/lib/query/query-client';

describe('getCachedSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearCachedSession();
  });

  it('reuses cached session within staleTime', async () => {
    const session = { user: { id: 'user-1' } };
    getSessionFn.mockResolvedValue(session);

    await expect(getCachedSession()).resolves.toEqual(session);
    await expect(getCachedSession()).resolves.toEqual(session);

    expect(getSessionFn).toHaveBeenCalledTimes(1);
  });

  it('refetches after cache is cleared', async () => {
    getSessionFn.mockResolvedValue({ user: { id: 'user-1' } });

    await getCachedSession();
    clearCachedSession();
    await getCachedSession();

    expect(getSessionFn).toHaveBeenCalledTimes(2);
    expect(queryClient.getQueryData(sessionQueryKey)).toBeDefined();
  });
});
