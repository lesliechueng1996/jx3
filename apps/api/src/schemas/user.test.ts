import { describe, expect, it } from 'bun:test';
import { meResponseSchema, toMeResponse } from './user';

const user = {
  id: 'u1',
  name: 'Alice',
  email: 'alice@example.com',
  emailVerified: false,
  image: null,
  role: 'user',
  createdAt: new Date('2026-01-01T00:00:00Z'),
};

describe('toMeResponse', () => {
  it('maps user fields and serializes createdAt', () => {
    const dto = toMeResponse(user);
    expect(dto).toEqual({
      id: 'u1',
      name: 'Alice',
      email: 'alice@example.com',
      emailVerified: false,
      image: null,
      role: 'user',
      createdAt: '2026-01-01T00:00:00.000Z',
    });
    expect(meResponseSchema.safeParse(dto).success).toBe(true);
  });
});
