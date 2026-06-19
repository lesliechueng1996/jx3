import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { createMockDb } from '../helpers/mock-db';

const mockDb = createMockDb();

mock.module('@jx3/db', () => ({
  db: mockDb,
}));

const {
  createAdminKungfu,
  deleteAdminKungfu,
  getAdminKungfuById,
  isKungfuReferenced,
  listAdminKungfu,
  listAllKungfuOptions,
  updateAdminKungfu,
} = await import('../../src/services/kungfu-admin');

const createdAt = new Date('2026-01-01T00:00:00Z');
const updatedAt = new Date('2026-01-02T00:00:00Z');

const kungfuRow = {
  id: 'kungfu-1',
  name: '傲血战意',
  schoolId: 'school-1',
  schoolName: '天策',
  kungfuType: 'attack' as const,
  attackType: 'external' as const,
  attackMethod: 'melee' as const,
  formationName: '阵眼',
  formationEffect: '效果',
  isPveExternalRecommended: true,
  isPveInternalRecommended: false,
  isUnlimited: false,
  icon: 'icon.png',
  alias: ['傲血'],
  createdAt,
  updatedAt,
};

describe('kungfu-admin service', () => {
  beforeEach(() => {
    mockDb.setResults([]);
  });

  it('lists all kungfu options', async () => {
    mockDb.setResults([
      [
        {
          id: 'kungfu-1',
          name: '傲血战意',
          schoolId: 'school-1',
          icon: 'icon.png',
          alias: ['傲血'],
        },
      ],
    ]);

    const result = await listAllKungfuOptions();

    expect(result.items).toEqual([
      {
        id: 'kungfu-1',
        name: '傲血战意',
        schoolId: 'school-1',
        icon: 'icon.png',
        alias: ['傲血'],
      },
    ]);
  });

  it('filters kungfu options by school', async () => {
    mockDb.setResults([
      [
        {
          id: 'kungfu-1',
          name: '傲血战意',
          schoolId: 'school-1',
          icon: null,
          alias: [],
        },
      ],
    ]);

    const result = await listAllKungfuOptions('school-1');

    expect(result.items[0]?.schoolId).toBe('school-1');
  });

  it('lists kungfu joined with school name', async () => {
    mockDb.setResults([[kungfuRow], [{ total: 1 }]]);

    const result = await listAdminKungfu({
      page: 1,
      pageSize: 20,
      schoolId: 'school-1',
    });

    expect(result.items[0]).toMatchObject({
      id: 'kungfu-1',
      schoolName: '天策',
      kungfuType: 'attack',
    });
    expect(result.total).toBe(1);
  });

  it('returns null when kungfu is missing', async () => {
    mockDb.setResults([[]]);

    await expect(getAdminKungfuById('missing')).resolves.toBeNull();
  });

  it('creates kungfu and reloads joined row', async () => {
    mockDb.setResults([[{ id: 'kungfu-1' }], [kungfuRow]]);

    const created = await createAdminKungfu({
      name: '傲血战意',
      schoolId: 'school-1',
      kungfuType: 'attack',
      attackType: 'external',
      attackMethod: 'melee',
      formationName: '阵眼',
      formationEffect: '效果',
      isPveExternalRecommended: true,
      isPveInternalRecommended: false,
      isUnlimited: false,
      icon: 'icon.png',
      alias: ['傲血'],
    });

    expect(created.schoolName).toBe('天策');
  });

  it('throws when created kungfu cannot be loaded', async () => {
    mockDb.setResults([[{ id: 'kungfu-1' }], []]);

    await expect(
      createAdminKungfu({
        name: '傲血战意',
        schoolId: 'school-1',
        kungfuType: 'attack',
        attackType: 'external',
        attackMethod: 'melee',
        formationName: null,
        formationEffect: null,
        isPveExternalRecommended: false,
        isPveInternalRecommended: false,
        isUnlimited: false,
        icon: null,
        alias: [],
      }),
    ).rejects.toThrow('Failed to load created kungfu');
  });

  it('throws when insert returning is empty', async () => {
    mockDb.setResults([[]]);

    await expect(
      createAdminKungfu({
        name: '傲血战意',
        schoolId: 'school-1',
        kungfuType: 'attack',
        attackType: 'external',
        attackMethod: 'melee',
        formationName: null,
        formationEffect: null,
        isPveExternalRecommended: false,
        isPveInternalRecommended: false,
        isUnlimited: false,
        icon: null,
        alias: [],
      }),
    ).rejects.toThrow('Failed to create kungfu');
  });

  it('applies internal and none formation filters', async () => {
    mockDb.setResults([
      [kungfuRow],
      [{ total: 1 }],
      [kungfuRow],
      [{ total: 1 }],
    ]);

    const internal = await listAdminKungfu({
      page: 1,
      pageSize: 20,
      formationRecommend: 'internal',
    });
    const none = await listAdminKungfu({
      page: 1,
      pageSize: 20,
      formationRecommend: 'none',
    });

    expect(internal.items).toHaveLength(1);
    expect(none.items).toHaveLength(1);
  });

  it('lists kungfu without filters', async () => {
    mockDb.setResults([[kungfuRow], [{ total: 1 }]]);

    const result = await listAdminKungfu({
      page: 1,
      pageSize: 20,
    });

    expect(result.items).toHaveLength(1);
  });

  it('applies kungfu list filters', async () => {
    mockDb.setResults([[kungfuRow], [{ total: 1 }]]);

    const result = await listAdminKungfu({
      page: 1,
      pageSize: 20,
      name: '傲血',
      kungfuType: 'attack',
      attackType: 'external',
      attackMethod: 'melee',
      formationRecommend: 'external',
      isUnlimited: false,
    });

    expect(result.items).toHaveLength(1);
  });

  it('updates and deletes kungfu', async () => {
    mockDb.setResults([
      [{ id: 'kungfu-1' }],
      [kungfuRow],
      [{ id: 'signup-1' }],
      [{ id: 'kungfu-1' }],
    ]);

    const updated = await updateAdminKungfu('kungfu-1', {
      name: '新名',
      attackType: 'external',
      attackMethod: 'melee',
      formationName: '阵眼',
      formationEffect: '效果',
      icon: 'icon.png',
    });
    const referenced = await isKungfuReferenced('kungfu-1');
    const deleted = await deleteAdminKungfu('kungfu-1');

    expect(updated?.name).toBe('傲血战意');
    expect(referenced).toBe(true);
    expect(deleted).toBe(true);
  });
});
