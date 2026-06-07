import { redirect } from '@tanstack/react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const getCachedSession = vi.fn();

vi.mock('../../../src/lib/auth/session-query', () => ({
  getCachedSession: () => getCachedSession(),
}));

import { Route } from '../../../src/routes/login/index';

describe('login route validateSearch', () => {
  it('keeps string redirect values', () => {
    const search = Route.options.validateSearch?.({
      redirect: '/settings',
    } as never);

    expect(search).toEqual({ redirect: '/settings' });
  });

  it('drops non-string redirect values', () => {
    const search = Route.options.validateSearch?.({
      redirect: 123,
    } as never);

    expect(search).toEqual({ redirect: undefined });
  });
});

describe('login route beforeLoad', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects authenticated users away from login', async () => {
    getCachedSession.mockResolvedValue({ user: { id: 'user-1' } });

    await expect(
      Route.options.beforeLoad?.({
        search: { redirect: '/settings' },
      } as never),
    ).rejects.toEqual(redirect({ to: '/settings' }));
  });

  it('sanitizes unsafe redirect targets', async () => {
    getCachedSession.mockResolvedValue({ user: { id: 'user-1' } });

    await expect(
      Route.options.beforeLoad?.({
        search: { redirect: 'https://evil.test' },
      } as never),
    ).rejects.toEqual(redirect({ to: '/' }));
  });

  it('allows unauthenticated users to stay on login', async () => {
    getCachedSession.mockResolvedValue(null);

    await expect(
      Route.options.beforeLoad?.({
        search: { redirect: '/settings' },
      } as never),
    ).resolves.toBeUndefined();
  });
});
