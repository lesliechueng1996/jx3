import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resolveSession } from '../../src/lib/get-session';

describe('resolveSession', () => {
  const getSession = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('forwards the cookie header when present', async () => {
    getSession.mockResolvedValue({ data: { user: { id: '1' } } });

    const session = await resolveSession(
      { cookie: 'session=abc' },
      { getSession },
    );

    expect(getSession).toHaveBeenCalledWith({
      fetchOptions: { headers: { cookie: 'session=abc' } },
    });
    expect(session).toEqual({ user: { id: '1' } });
  });

  it('omits fetch options when cookie is missing', async () => {
    getSession.mockResolvedValue({ data: null });

    const session = await resolveSession({}, { getSession });

    expect(getSession).toHaveBeenCalledWith({
      fetchOptions: undefined,
    });
    expect(session).toBeNull();
  });
});
