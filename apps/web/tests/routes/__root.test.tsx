import { redirect } from '@tanstack/react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const getSessionFn = vi.fn();

vi.mock('../../src/lib/get-session', () => ({
  getSessionFn: () => getSessionFn(),
}));

import { Route } from '../../src/routes/__root';

describe('root route beforeLoad', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('skips session lookup for public paths', async () => {
    const result = await Route.options.beforeLoad?.({
      location: { pathname: '/login', search: '' },
    } as never);

    expect(result).toBeUndefined();
    expect(getSessionFn).not.toHaveBeenCalled();
  });

  it('returns session context for authenticated users', async () => {
    const session = { user: { id: 'user-1' } };
    getSessionFn.mockResolvedValue(session);

    const result = await Route.options.beforeLoad?.({
      location: { pathname: '/settings', search: '' },
    } as never);

    expect(result).toEqual({ session });
  });

  it('redirects unauthenticated users to login', async () => {
    getSessionFn.mockResolvedValue(null);

    await expect(
      Route.options.beforeLoad?.({
        location: { pathname: '/settings', search: '?tab=profile' },
      } as never),
    ).rejects.toEqual(
      redirect({
        to: '/login',
        search: { redirect: '/settings?tab=profile' },
      }),
    );
  });
});

describe('root route head', () => {
  it('defines document head metadata', () => {
    const head = Route.options.head?.({} as never);

    expect(head?.meta).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ charSet: 'utf-8' }),
        expect.objectContaining({ title: 'TanStack Start Starter' }),
      ]),
    );
    expect(head?.links?.[0]).toEqual(
      expect.objectContaining({ rel: 'stylesheet' }),
    );
  });
});
