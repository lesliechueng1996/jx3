import { account, session, user } from '@jx3/auth/schema';
import { db } from '@jx3/db';
import { and, count, desc, eq, ilike, inArray, type SQL } from 'drizzle-orm';
import type { ListUsersQuery } from '../schemas/users-admin';
import {
  type AdminUserListItem,
  maskEmail,
  normalizeProviders,
} from '../schemas/users-admin';

const buildWhereClause = (query: ListUsersQuery): SQL | undefined => {
  const conditions: SQL[] = [];

  if (query.name) {
    conditions.push(ilike(user.name, `%${query.name}%`));
  }

  if (query.email) {
    conditions.push(ilike(user.email, `%${query.email}%`));
  }

  if (query.role) {
    conditions.push(eq(user.role, query.role));
  }

  if (query.banned !== undefined) {
    conditions.push(eq(user.banned, query.banned));
  }

  if (query.provider) {
    conditions.push(
      inArray(
        user.id,
        db
          .select({ userId: account.userId })
          .from(account)
          .where(eq(account.providerId, query.provider)),
      ),
    );
  }

  if (conditions.length === 0) {
    return undefined;
  }

  return and(...conditions);
};

const toListItem = (
  row: typeof user.$inferSelect,
  providers: string[],
  lastLoginIp: string | null,
): AdminUserListItem => ({
  id: row.id,
  name: row.name,
  emailMasked: maskEmail(row.email),
  role: row.role ?? null,
  banned: row.banned ?? false,
  banReason: row.banReason ?? null,
  banDate: row.banned ? row.updatedAt.toISOString() : null,
  lastLoginIp,
  providers: normalizeProviders(providers),
  createdAt: row.createdAt.toISOString(),
});

export const listAdminUsers = async (
  query: ListUsersQuery,
): Promise<{
  items: AdminUserListItem[];
  total: number;
  page: number;
  pageSize: number;
}> => {
  const where = buildWhereClause(query);
  const offset = (query.page - 1) * query.pageSize;

  const [rows, totalRows] = await Promise.all([
    db
      .select()
      .from(user)
      .where(where)
      .orderBy(desc(user.createdAt))
      .limit(query.pageSize)
      .offset(offset),
    db.select({ total: count() }).from(user).where(where),
  ]);

  const userIds = rows.map((row) => row.id);
  if (userIds.length === 0) {
    return {
      items: [],
      total: totalRows[0]?.total ?? 0,
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  const [accounts, sessions] = await Promise.all([
    db
      .select({
        userId: account.userId,
        providerId: account.providerId,
      })
      .from(account)
      .where(inArray(account.userId, userIds)),
    db
      .select({
        userId: session.userId,
        ipAddress: session.ipAddress,
        createdAt: session.createdAt,
      })
      .from(session)
      .where(inArray(session.userId, userIds))
      .orderBy(desc(session.createdAt)),
  ]);

  const providersByUser = new Map<string, string[]>();
  for (const row of accounts) {
    const existing = providersByUser.get(row.userId) ?? [];
    existing.push(row.providerId);
    providersByUser.set(row.userId, existing);
  }

  const lastLoginIpByUser = new Map<string, string | null>();
  for (const row of sessions) {
    if (!lastLoginIpByUser.has(row.userId)) {
      lastLoginIpByUser.set(row.userId, row.ipAddress ?? null);
    }
  }

  return {
    items: rows.map((row) =>
      toListItem(
        row,
        providersByUser.get(row.id) ?? [],
        lastLoginIpByUser.get(row.id) ?? null,
      ),
    ),
    total: totalRows[0]?.total ?? 0,
    page: query.page,
    pageSize: query.pageSize,
  };
};

export const getAdminUserById = async (
  userId: string,
): Promise<AdminUserListItem | null> => {
  const rows = await db.select().from(user).where(eq(user.id, userId)).limit(1);
  const row = rows[0];
  if (!row) {
    return null;
  }

  const [accounts, sessions] = await Promise.all([
    db
      .select({ providerId: account.providerId })
      .from(account)
      .where(eq(account.userId, userId)),
    db
      .select({
        ipAddress: session.ipAddress,
        createdAt: session.createdAt,
      })
      .from(session)
      .where(eq(session.userId, userId))
      .orderBy(desc(session.createdAt))
      .limit(1),
  ]);

  return toListItem(
    row,
    accounts.map((item) => item.providerId),
    sessions[0]?.ipAddress ?? null,
  );
};
