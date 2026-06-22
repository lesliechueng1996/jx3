import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { createMockDb } from '../helpers/mock-db';

const mockDb = createMockDb();

mock.module('@jx3/db', () => ({
  db: mockDb,
}));

const { searchRaidSignups } = await import('../../src/services/raid-signups');

describe('raid-signups service', () => {
  beforeEach(() => {
    mockDb.setResults([]);
  });

  it('returns empty items for blank search', async () => {
    const result = await searchRaidSignups('');
    expect(result).toEqual({ items: [] });
  });

  it('returns empty items when no historical signup exists', async () => {
    mockDb.setResults([[]]);

    const result = await searchRaidSignups('叶修');
    expect(result).toEqual({ items: [] });
  });

  it('returns fuzzy search matches with deduplicated attributes', async () => {
    mockDb.setResults([
      [
        {
          characterName: ' 叶修 ',
          serverId: 'server-1',
          schoolId: 'school-1',
          kungfuId: 'kungfu-1',
          serverZone: '电信区',
          serverName: '梦江南',
          kungfuName: '天策',
        },
        {
          characterName: '叶修',
          serverId: 'server-1',
          schoolId: 'school-1',
          kungfuId: 'kungfu-1',
          serverZone: '电信区',
          serverName: '梦江南',
          kungfuName: '天策',
        },
        {
          characterName: '叶修二号',
          serverId: 'server-2',
          schoolId: 'school-2',
          kungfuId: 'kungfu-2',
          serverZone: '双线区',
          serverName: '幽月轮',
          kungfuName: '冰心诀',
        },
      ],
    ]);

    const result = await searchRaidSignups('叶');
    expect(result.items).toEqual([
      {
        characterName: '叶修',
        serverId: 'server-1',
        schoolId: 'school-1',
        kungfuId: 'kungfu-1',
        serverLabel: '电信区 · 梦江南',
        kungfuName: '天策',
      },
      {
        characterName: '叶修二号',
        serverId: 'server-2',
        schoolId: 'school-2',
        kungfuId: 'kungfu-2',
        serverLabel: '双线区 · 幽月轮',
        kungfuName: '冰心诀',
      },
    ]);
  });
});
