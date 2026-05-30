import { z } from 'zod';

export const errorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});

export type ErrorResponse = z.infer<typeof errorSchema>;

export const errorResponse = (
  code: string,
  message: string,
  details?: unknown,
): ErrorResponse =>
  details === undefined
    ? { error: { code, message } }
    : { error: { code, message, details } };
