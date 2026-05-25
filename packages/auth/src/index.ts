import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';

type DrizzleDB = Parameters<typeof drizzleAdapter>[0];

export const createAuth = (db: DrizzleDB) =>
  betterAuth({
    database: drizzleAdapter(db, {
      provider: 'pg',
    }),
  });
