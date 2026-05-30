import { describe, expect, it } from 'bun:test';
import { errorResponse, errorSchema } from '../../src/schemas/common';

describe('errorResponse', () => {
  it('wraps code and message', () => {
    const body = errorResponse('UNAUTHORIZED', 'Not signed in');
    expect(body).toEqual({
      error: { code: 'UNAUTHORIZED', message: 'Not signed in' },
    });
    expect(errorSchema.safeParse(body).success).toBe(true);
  });

  it('includes details when provided', () => {
    const body = errorResponse('BAD_REQUEST', 'Invalid', { field: 'email' });
    expect(body.error.details).toEqual({ field: 'email' });
  });
});
