import { db } from '@jx3/db';
import { gameKungfu, gameSchool, raidSignup } from '@jx3/db/schema';
import { and, count, desc, eq, ilike, type SQL } from 'drizzle-orm';
import type {
  AdminKungfuListItem,
  CreateKungfuBody,
  ListKungfuQuery,
  UpdateKungfuBody,
} from '../schemas/kungfu-admin';

type KungfuRow = typeof gameKungfu.$inferSelect & {
  schoolName: string;
};

const toListItem = (row: KungfuRow): AdminKungfuListItem => ({
  id: row.id,
  name: row.name,
  schoolId: row.schoolId,
  schoolName: row.schoolName,
  kungfuType: row.kungfuType,
  attackType: row.attackType ?? null,
  attackMethod: row.attackMethod ?? null,
  formationEffect: row.formationEffect ?? null,
  isPveExternalRecommended: row.isPveExternalRecommended,
  isPveInternalRecommended: row.isPveInternalRecommended,
  isUnlimited: row.isUnlimited,
  icon: row.icon ?? null,
  alias: row.alias,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

const buildWhereClause = (query: ListKungfuQuery): SQL | undefined => {
  const conditions: SQL[] = [];

  if (query.name) {
    conditions.push(ilike(gameKungfu.name, `%${query.name}%`));
  }

  if (query.schoolId) {
    conditions.push(eq(gameKungfu.schoolId, query.schoolId));
  }

  if (query.kungfuType) {
    conditions.push(eq(gameKungfu.kungfuType, query.kungfuType));
  }

  if (query.attackType) {
    conditions.push(eq(gameKungfu.attackType, query.attackType));
  }

  if (query.attackMethod) {
    conditions.push(eq(gameKungfu.attackMethod, query.attackMethod));
  }

  if (query.formationRecommend === 'external') {
    conditions.push(eq(gameKungfu.isPveExternalRecommended, true));
  }

  if (query.formationRecommend === 'internal') {
    conditions.push(eq(gameKungfu.isPveInternalRecommended, true));
  }

  if (query.formationRecommend === 'none') {
    conditions.push(eq(gameKungfu.isPveExternalRecommended, false));
    conditions.push(eq(gameKungfu.isPveInternalRecommended, false));
  }

  if (query.isUnlimited !== undefined) {
    conditions.push(eq(gameKungfu.isUnlimited, query.isUnlimited));
  }

  if (conditions.length === 0) {
    return undefined;
  }

  return and(...conditions);
};

const selectKungfuWithSchool = () =>
  db
    .select({
      id: gameKungfu.id,
      name: gameKungfu.name,
      schoolId: gameKungfu.schoolId,
      schoolName: gameSchool.name,
      kungfuType: gameKungfu.kungfuType,
      attackType: gameKungfu.attackType,
      attackMethod: gameKungfu.attackMethod,
      formationEffect: gameKungfu.formationEffect,
      isPveExternalRecommended: gameKungfu.isPveExternalRecommended,
      isPveInternalRecommended: gameKungfu.isPveInternalRecommended,
      isUnlimited: gameKungfu.isUnlimited,
      icon: gameKungfu.icon,
      alias: gameKungfu.alias,
      createdAt: gameKungfu.createdAt,
      updatedAt: gameKungfu.updatedAt,
    })
    .from(gameKungfu)
    .innerJoin(gameSchool, eq(gameKungfu.schoolId, gameSchool.id));

export const listAdminKungfu = async (
  query: ListKungfuQuery,
): Promise<{
  items: AdminKungfuListItem[];
  total: number;
  page: number;
  pageSize: number;
}> => {
  const where = buildWhereClause(query);
  const offset = (query.page - 1) * query.pageSize;

  const [rows, totalRows] = await Promise.all([
    selectKungfuWithSchool()
      .where(where)
      .orderBy(desc(gameKungfu.createdAt))
      .limit(query.pageSize)
      .offset(offset),
    db.select({ total: count() }).from(gameKungfu).where(where),
  ]);

  return {
    items: rows.map(toListItem),
    total: totalRows[0]?.total ?? 0,
    page: query.page,
    pageSize: query.pageSize,
  };
};

export const getAdminKungfuById = async (
  kungfuId: string,
): Promise<AdminKungfuListItem | null> => {
  const rows = await selectKungfuWithSchool()
    .where(eq(gameKungfu.id, kungfuId))
    .limit(1);

  const row = rows[0];
  if (!row) {
    return null;
  }

  return toListItem(row);
};

export const createAdminKungfu = async (
  body: CreateKungfuBody,
): Promise<AdminKungfuListItem> => {
  const rows = await db
    .insert(gameKungfu)
    .values({
      name: body.name,
      schoolId: body.schoolId,
      kungfuType: body.kungfuType,
      attackType: body.attackType,
      attackMethod: body.attackMethod,
      formationEffect: body.formationEffect,
      isPveExternalRecommended: body.isPveExternalRecommended,
      isPveInternalRecommended: body.isPveInternalRecommended,
      isUnlimited: body.isUnlimited,
      icon: body.icon,
      alias: body.alias,
    })
    .returning({ id: gameKungfu.id });

  const row = rows[0];
  if (!row) {
    throw new Error('Failed to create kungfu');
  }

  const created = await getAdminKungfuById(row.id);
  if (!created) {
    throw new Error('Failed to load created kungfu');
  }

  return created;
};

export const updateAdminKungfu = async (
  kungfuId: string,
  body: UpdateKungfuBody,
): Promise<AdminKungfuListItem | null> => {
  const rows = await db
    .update(gameKungfu)
    .set({
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.schoolId !== undefined ? { schoolId: body.schoolId } : {}),
      ...(body.kungfuType !== undefined ? { kungfuType: body.kungfuType } : {}),
      ...(body.attackType !== undefined ? { attackType: body.attackType } : {}),
      ...(body.attackMethod !== undefined
        ? { attackMethod: body.attackMethod }
        : {}),
      ...(body.formationEffect !== undefined
        ? { formationEffect: body.formationEffect }
        : {}),
      ...(body.isPveExternalRecommended !== undefined
        ? { isPveExternalRecommended: body.isPveExternalRecommended }
        : {}),
      ...(body.isPveInternalRecommended !== undefined
        ? { isPveInternalRecommended: body.isPveInternalRecommended }
        : {}),
      ...(body.isUnlimited !== undefined
        ? { isUnlimited: body.isUnlimited }
        : {}),
      ...(body.icon !== undefined ? { icon: body.icon } : {}),
      ...(body.alias !== undefined ? { alias: body.alias } : {}),
    })
    .where(eq(gameKungfu.id, kungfuId))
    .returning({ id: gameKungfu.id });

  const row = rows[0];
  if (!row) {
    return null;
  }

  return getAdminKungfuById(row.id);
};

export const isKungfuReferenced = async (
  kungfuId: string,
): Promise<boolean> => {
  const rows = await db
    .select({ id: raidSignup.id })
    .from(raidSignup)
    .where(eq(raidSignup.kungfuId, kungfuId))
    .limit(1);

  return rows.length > 0;
};

export const deleteAdminKungfu = async (kungfuId: string): Promise<boolean> => {
  const rows = await db
    .delete(gameKungfu)
    .where(eq(gameKungfu.id, kungfuId))
    .returning({ id: gameKungfu.id });

  return rows.length > 0;
};
