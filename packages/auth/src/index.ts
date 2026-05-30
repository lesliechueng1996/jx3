import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { admin } from 'better-auth/plugins';

type DrizzleDB = Parameters<typeof drizzleAdapter>[0];

export const createAuth = (db: DrizzleDB) =>
  betterAuth({
    database: drizzleAdapter(db, {
      provider: 'pg',
    }),
    plugins: [admin()],
  });
