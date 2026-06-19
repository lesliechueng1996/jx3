import { createIsomorphicFn } from '@tanstack/react-start';
import { z } from 'zod';

export class ApiRequestError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

const errorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

const DEFAULT_SERVER_ORIGIN = process.env.WEB_URL ?? 'http://localhost:3000';

export const resolveRequestUrl = (
  path: string,
  baseUrl: string = typeof window !== 'undefined'
    ? window.location.origin
    : DEFAULT_SERVER_ORIGIN,
): string => {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return new URL(path, baseUrl).href;
};

const appendServerCookies = createIsomorphicFn()
  .client(async (_headers: Headers): Promise<void> => {
    // Browser fetch sends cookies via credentials: 'include'.
  })
  .server(async (headers: Headers): Promise<void> => {
    const { appendServerCookies: append } = await import(
      '#/lib/api/append-server-cookies.server'
    );
    await append(headers);
  });

export const parseJson = async <T>(
  response: Response,
  schema: z.ZodType<T>,
): Promise<T> => {
  const payload: unknown = await response.json();
  return schema.parse(payload);
};

export const requestJson = async <T>(
  path: string,
  schema: z.ZodType<T>,
  init?: RequestInit,
): Promise<T> => {
  const headers = new Headers(init?.headers);

  if (!headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }

  await appendServerCookies(headers);

  const response = await fetch(resolveRequestUrl(path), {
    credentials: 'include',
    ...init,
    headers,
  });

  if (!response.ok) {
    try {
      const error = await parseJson(response, errorResponseSchema);
      throw new ApiRequestError(
        response.status,
        error.error.code,
        error.error.message,
      );
    } catch (error) {
      if (error instanceof ApiRequestError) {
        throw error;
      }
      throw new ApiRequestError(response.status, 'REQUEST_FAILED', '请求失败');
    }
  }

  if (response.status === 204) {
    return schema.parse(null);
  }

  return parseJson(response, schema);
};
