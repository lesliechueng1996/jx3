import type { Logger } from '@jx3/logger';
import { Jx3ApiError } from './errors';

export interface FetchJsonOptions extends Omit<RequestInit, 'body'> {
  logger?: Logger;
}

export async function fetchJson<T>(
  url: string,
  options: FetchJsonOptions = {},
): Promise<T> {
  const { logger, ...init } = options;

  logger?.debug({ url, method: init.method ?? 'GET' }, 'jx3api request');

  let response: Response;

  try {
    response = await fetch(url, init);
  } catch (error) {
    throw new Jx3ApiError('Failed to reach upstream API', {
      code: 'NETWORK_ERROR',
      cause: error,
    });
  }

  if (!response.ok) {
    throw new Jx3ApiError(`Upstream API returned ${response.status}`, {
      code: 'HTTP_ERROR',
      status: response.status,
    });
  }

  try {
    return (await response.json()) as T;
  } catch (error) {
    throw new Jx3ApiError('Failed to parse upstream JSON response', {
      code: 'PARSE_ERROR',
      status: response.status,
      cause: error,
    });
  }
}
