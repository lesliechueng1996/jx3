import { describe, expect, it, vi } from 'vitest';
import { resolveSession } from '../../../src/lib/auth/get-session';

describe('resolveSession', () => {
  it('forwards cookies to auth client getSession', async () => {
    const getSession = vi.fn(async () => ({
      data: { user: { id: 'user-1' } },
    }));

    const session = await resolveSession(
      { cookie: 'session=abc' },
      { getSession },
    );

    expect(getSession).toHaveBeenCalledWith({
      fetchOptions: { headers: { cookie: 'session=abc' } },
    });
    expect(session).toEqual({ user: { id: 'user-1' } });
  });

  it('returns null when auth client has no session', async () => {
    const getSession = vi.fn(async () => ({ data: null }));

    await expect(resolveSession({}, { getSession })).resolves.toBeNull();
    expect(getSession).toHaveBeenCalledWith({ fetchOptions: undefined });
  });
});
