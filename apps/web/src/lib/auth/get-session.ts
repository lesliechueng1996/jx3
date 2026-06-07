import { createServerFn } from '@tanstack/react-start';
import { getRequestHeaders } from '@tanstack/react-start/server';
import { authClient, type Session } from '#/lib/auth/auth-client';

export async function resolveSession(
  headers: HeadersInit,
  client: Pick<typeof authClient, 'getSession'> = authClient,
): Promise<Session | null> {
  const incoming = new Headers(headers);
  const cookie = incoming.get('cookie');

  const { data } = await client.getSession({
    fetchOptions: cookie ? { headers: { cookie } } : undefined,
  });

  return data as Session | null;
}

export const getSessionFn = createServerFn({ method: 'GET' }).handler(
  async () => resolveSession(getRequestHeaders() as HeadersInit),
);
