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
  const response = await fetch(path, {
    credentials: 'include',
    ...init,
    headers: {
      'content-type': 'application/json',
      ...init?.headers,
    },
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

  return parseJson(response, schema);
};
