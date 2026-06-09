import { mock } from 'bun:test';

type FetchImpl = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

export function stubGlobalFetch(impl: FetchImpl): void {
  globalThis.fetch = mock(impl) as unknown as typeof fetch;
}
