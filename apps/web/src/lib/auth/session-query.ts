import type { Session } from '#/lib/auth/auth-client';
import { getSessionFn } from '#/lib/auth/get-session';
import { queryClient } from '#/lib/query/query-client';

export const sessionQueryKey = ['session'] as const;

const SESSION_STALE_TIME_MS = 5 * 60_000;

export async function getCachedSession(): Promise<Session | null> {
  return queryClient.fetchQuery({
    queryKey: sessionQueryKey,
    queryFn: () => getSessionFn(),
    staleTime: SESSION_STALE_TIME_MS,
  });
}

export async function invalidateCachedSession(): Promise<void> {
  await queryClient.invalidateQueries({ queryKey: sessionQueryKey });
}

export function clearCachedSession(): void {
  queryClient.removeQueries({ queryKey: sessionQueryKey });
}
