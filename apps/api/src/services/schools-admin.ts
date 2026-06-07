import { db } from '@jx3/db';
import { gameCharacter, gameKungfu, gameSchool } from '@jx3/db/schema';
import { and, count, desc, eq, ilike, type SQL, sql } from 'drizzle-orm';
import type {
  AdminSchoolListItem,
  CreateSchoolBody,
  ListSchoolsQuery,
  UpdateSchoolBody,
} from '../schemas/schools-admin';

const toListItem = (
  row: typeof gameSchool.$inferSelect,
): AdminSchoolListItem => ({
  id: row.id,
  name: row.name,
  type: row.type,
  icon: row.icon ?? null,
  alias: row.alias,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

const buildWhereClause = (query: ListSchoolsQuery): SQL | undefined => {
  const conditions: SQL[] = [];

  if (query.name) {
    conditions.push(ilike(gameSchool.name, `%${query.name}%`));
  }

  if (query.type) {
    conditions.push(eq(gameSchool.type, query.type));
  }

  if (query.alias) {
    conditions.push(
      ilike(sql`array_to_string(${gameSchool.alias}, ',')`, `%${query.alias}%`),
    );
  }

  if (conditions.length === 0) {
    return undefined;
  }

  return and(...conditions);
};

export const listAdminSchools = async (
  query: ListSchoolsQuery,
): Promise<{
  items: AdminSchoolListItem[];
  total: number;
  page: number;
  pageSize: number;
}> => {
  const where = buildWhereClause(query);
  const offset = (query.page - 1) * query.pageSize;

  const [rows, totalRows] = await Promise.all([
    db
      .select()
      .from(gameSchool)
      .where(where)
      .orderBy(desc(gameSchool.createdAt))
      .limit(query.pageSize)
      .offset(offset),
    db.select({ total: count() }).from(gameSchool).where(where),
  ]);

  return {
    items: rows.map(toListItem),
    total: totalRows[0]?.total ?? 0,
    page: query.page,
    pageSize: query.pageSize,
  };
};

export const getAdminSchoolById = async (
  schoolId: string,
): Promise<AdminSchoolListItem | null> => {
  const rows = await db
    .select()
    .from(gameSchool)
    .where(eq(gameSchool.id, schoolId))
    .limit(1);

  const row = rows[0];
  if (!row) {
    return null;
  }

  return toListItem(row);
};

export const createAdminSchool = async (
  body: CreateSchoolBody,
): Promise<AdminSchoolListItem> => {
  const rows = await db
    .insert(gameSchool)
    .values({
      name: body.name,
      type: body.type,
      icon: body.icon,
      alias: body.alias,
    })
    .returning();

  const row = rows[0];
  if (!row) {
    throw new Error('Failed to create school');
  }

  return toListItem(row);
};

export const updateAdminSchool = async (
  schoolId: string,
  body: UpdateSchoolBody,
): Promise<AdminSchoolListItem | null> => {
  const rows = await db
    .update(gameSchool)
    .set({
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.type !== undefined ? { type: body.type } : {}),
      ...(body.icon !== undefined ? { icon: body.icon } : {}),
      ...(body.alias !== undefined ? { alias: body.alias } : {}),
    })
    .where(eq(gameSchool.id, schoolId))
    .returning();

  const row = rows[0];
  if (!row) {
    return null;
  }

  return toListItem(row);
};

export const isSchoolReferenced = async (
  schoolId: string,
): Promise<boolean> => {
  const [kungfuRows, characterRows] = await Promise.all([
    db
      .select({ id: gameKungfu.id })
      .from(gameKungfu)
      .where(eq(gameKungfu.schoolId, schoolId))
      .limit(1),
    db
      .select({ id: gameCharacter.id })
      .from(gameCharacter)
      .where(eq(gameCharacter.schoolId, schoolId))
      .limit(1),
  ]);

  return kungfuRows.length > 0 || characterRows.length > 0;
};

export const deleteAdminSchool = async (schoolId: string): Promise<boolean> => {
  const rows = await db
    .delete(gameSchool)
    .where(eq(gameSchool.id, schoolId))
    .returning({ id: gameSchool.id });

  return rows.length > 0;
};
