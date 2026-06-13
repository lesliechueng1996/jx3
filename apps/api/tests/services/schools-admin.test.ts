import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { createMockDb } from '../helpers/mock-db';

const mockDb = createMockDb();

mock.module('@jx3/db', () => ({
  db: mockDb,
}));

const {
  createAdminSchool,
  deleteAdminSchool,
  getAdminSchoolById,
  isSchoolReferenced,
  listAdminSchools,
  listAllSchoolOptions,
  updateAdminSchool,
} = await import('../../src/services/schools-admin');

const createdAt = new Date('2026-01-01T00:00:00Z');
const updatedAt = new Date('2026-01-02T00:00:00Z');

const schoolRow = {
  id: 'school-1',
  name: '天策',
  type: 'school' as const,
  icon: 'icon.png',
  alias: ['天策府'],
  createdAt,
  updatedAt,
};

describe('schools-admin service', () => {
  beforeEach(() => {
    mockDb.setResults([]);
  });

  it('lists school options', async () => {
    mockDb.setResults([[{ id: 'school-1', name: '天策' }]]);

    await expect(listAllSchoolOptions()).resolves.toEqual({
      items: [{ id: 'school-1', name: '天策' }],
    });
  });

  it('lists schools with pagination metadata', async () => {
    mockDb.setResults([[schoolRow], [{ total: 1 }]]);

    const result = await listAdminSchools({
      page: 1,
      pageSize: 20,
      name: '天',
    });

    expect(result).toEqual({
      items: [
        {
          id: 'school-1',
          name: '天策',
          type: 'school',
          icon: 'icon.png',
          alias: ['天策府'],
          createdAt: createdAt.toISOString(),
          updatedAt: updatedAt.toISOString(),
        },
      ],
      total: 1,
      page: 1,
      pageSize: 20,
    });
  });

  it('returns null for a missing school', async () => {
    mockDb.setResults([[]]);

    await expect(getAdminSchoolById('missing')).resolves.toBeNull();
  });

  it('creates and updates a school', async () => {
    mockDb.setResults([[schoolRow], [schoolRow]]);

    const created = await createAdminSchool({
      name: '天策',
      type: 'school',
      icon: 'icon.png',
      alias: ['天策府'],
    });
    const updated = await updateAdminSchool('school-1', {
      name: '天策府',
      icon: 'icon.png',
    });

    expect(created.name).toBe('天策');
    expect(updated?.name).toBe('天策');
  });

  it('throws when create returning is empty', async () => {
    mockDb.setResults([[]]);

    await expect(
      createAdminSchool({
        name: '天策',
        type: 'school',
        icon: null,
        alias: [],
      }),
    ).rejects.toThrow('Failed to create school');
  });

  it('lists schools without filters', async () => {
    mockDb.setResults([[schoolRow], [{ total: 1 }]]);

    const result = await listAdminSchools({
      page: 1,
      pageSize: 20,
    });

    expect(result.items).toHaveLength(1);
  });

  it('lists schools with type and alias filters', async () => {
    mockDb.setResults([[schoolRow], [{ total: 1 }]]);

    const result = await listAdminSchools({
      page: 1,
      pageSize: 20,
      type: 'school',
      alias: '天策',
    });

    expect(result.total).toBe(1);
  });

  it('returns null when updating a missing school', async () => {
    mockDb.setResults([[]]);

    await expect(
      updateAdminSchool('missing', { name: 'x', icon: null }),
    ).resolves.toBeNull();
  });

  it('detects references and deletes schools', async () => {
    mockDb.setResults([[{ id: 'kungfu-1' }], [], [{ id: 'school-1' }]]);

    await expect(isSchoolReferenced('school-1')).resolves.toBe(true);
    await expect(deleteAdminSchool('school-1')).resolves.toBe(true);
  });
});
