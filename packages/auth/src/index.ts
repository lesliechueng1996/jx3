import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { admin, bearer } from 'better-auth/plugins';
import { ac, authRoles } from './permissions';
import { USER_ROLE } from './roles';

type DrizzleDB = Parameters<typeof drizzleAdapter>[0];

export const createAuth = (db: DrizzleDB) =>
  betterAuth({
    database: drizzleAdapter(db, { provider: 'pg' }),
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL,
    trustedOrigins: [process.env.WEB_ORIGIN ?? 'http://localhost:3000'],
    emailAndPassword: { enabled: true },
    socialProviders: {
      github: {
        clientId: process.env.GITHUB_CLIENT_ID as string,
        clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
      },
    },
    plugins: [
      admin({
        ac,
        roles: authRoles,
        defaultRole: USER_ROLE,
      }),
      bearer(),
    ],
  });

export type Auth = ReturnType<typeof createAuth>;
