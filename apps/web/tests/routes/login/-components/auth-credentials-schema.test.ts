import { describe, expect, it } from 'vitest';
import { authCredentialsSchema } from '../../../../src/routes/login/-components/auth-credentials-schema';

describe('authCredentialsSchema', () => {
  it('accepts valid email and password', () => {
    const result = authCredentialsSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = authCredentialsSchema.safeParse({
      email: 'not-an-email',
      password: 'password123',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'email')).toBe(true);
    }
  });

  it('rejects short password', () => {
    const result = authCredentialsSchema.safeParse({
      email: 'user@example.com',
      password: 'short',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'password')).toBe(
        true,
      );
    }
  });
});
