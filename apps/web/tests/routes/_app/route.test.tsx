import { redirect } from '@tanstack/react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const getCachedSession = vi.fn();

vi.mock('../../../src/lib/session-query', () => ({
  getCachedSession: () => getCachedSession(),
}));

import { Route } from '../../../src/routes/_app/route';

describe('app layout route beforeLoad', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns session context for authenticated users', async () => {
    const session = { user: { id: 'user-1' } };
    getCachedSession.mockResolvedValue(session);

    const result = await Route.options.beforeLoad?.({
      location: { pathname: '/characters', search: '' },
    } as never);

    expect(result).toEqual({ session });
  });

  it('redirects unauthenticated users to login', async () => {
    getCachedSession.mockResolvedValue(null);

    await expect(
      Route.options.beforeLoad?.({
        location: { pathname: '/characters', search: '?tab=1' },
      } as never),
    ).rejects.toEqual(
      redirect({
        to: '/login',
        search: { redirect: '/characters?tab=1' },
      }),
    );
  });
});
