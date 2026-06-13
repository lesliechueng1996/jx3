import { describe, expect, it, mock } from 'bun:test';

const mockDb = mock();
const mockCreateAuth = mock();

mock.module('@jx3/auth', () => {
  return {
    createAuth: mockCreateAuth,
  };
});

mock.module('@jx3/db', () => {
  return {
    db: mockDb,
  };
});

describe('lib/auth', () => {
  it('should create auth', async () => {
    await import('../../src/lib/auth');
    expect(mockCreateAuth).toHaveBeenCalledWith(mockDb);
  });
});
