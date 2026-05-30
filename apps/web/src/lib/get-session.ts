import { createServerFn } from '@tanstack/react-start';
import { getRequestHeaders } from '@tanstack/react-start/server';
import { authClient, type Session } from '#/lib/auth-client';

export const getSessionFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const incoming = new Headers(getRequestHeaders() as HeadersInit);
    const cookie = incoming.get('cookie');

    const { data } = await authClient.getSession({
      fetchOptions: cookie ? { headers: { cookie } } : undefined,
    });

    return data as Session;
  },
);
