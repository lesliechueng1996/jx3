import { describe, expect, it } from 'bun:test';
import { matchSignupsAgainstBlocklist } from '../../src/services/blocklist-matching';

const serverA = '11111111-1111-4111-8111-111111111111';
const serverB = '22222222-2222-4222-8222-222222222222';

describe('matchSignupsAgainstBlocklist', () => {
  it('returns passed when there are no matches', () => {
    const result = matchSignupsAgainstBlocklist(
      [
        {
          id: 'signup-1',
          characterName: '叶修',
          serverId: serverA,
          serverName: '梦江南',
          schoolName: '天策',
        },
      ],
      [
        {
          id: 'block-1',
          characterName: '韩文清',
          serverId: serverA,
          serverName: '梦江南',
          schoolName: null,
          remark: null,
        },
      ],
    );

    expect(result.passed).toBe(true);
    expect(result.confirmedMatches).toEqual([]);
    expect(result.possibleMatches).toEqual([]);
    expect(result.skippedCount).toBe(0);
  });

  it('returns confirmed matches for same server and character name', () => {
    const result = matchSignupsAgainstBlocklist(
      [
        {
          id: 'signup-1',
          characterName: ' 叶修 ',
          serverId: serverA,
          serverName: '梦江南',
          schoolName: '天策',
        },
      ],
      [
        {
          id: 'block-1',
          characterName: '叶修',
          serverId: serverA,
          serverName: '梦江南',
          schoolName: '藏剑',
          remark: '跳车',
        },
      ],
    );

    expect(result.passed).toBe(false);
    expect(result.confirmedMatches).toHaveLength(1);
    expect(result.confirmedMatches[0]?.characterName).toBe(' 叶修 ');
    expect(result.confirmedMatches[0]?.remark).toBe('跳车');
    expect(result.possibleMatches).toEqual([]);
  });

  it('returns possible matches when only character name matches', () => {
    const result = matchSignupsAgainstBlocklist(
      [
        {
          id: 'signup-1',
          characterName: '叶修',
          serverId: serverA,
          serverName: '梦江南',
          schoolName: null,
        },
      ],
      [
        {
          id: 'block-1',
          characterName: '叶修',
          serverId: serverB,
          serverName: '幽月轮',
          schoolName: null,
          remark: '毛装备',
        },
      ],
    );

    expect(result.passed).toBe(false);
    expect(result.confirmedMatches).toEqual([]);
    expect(result.possibleMatches).toHaveLength(1);
    expect(result.possibleMatches[0]?.blocklistServerName).toBe('幽月轮');
  });

  it('counts signups without server as skipped and still checks possible matches', () => {
    const result = matchSignupsAgainstBlocklist(
      [
        {
          id: 'signup-1',
          characterName: '叶修',
          serverId: null,
          serverName: null,
          schoolName: null,
        },
      ],
      [
        {
          id: 'block-1',
          characterName: '叶修',
          serverId: serverB,
          serverName: '幽月轮',
          schoolName: null,
          remark: null,
        },
      ],
    );

    expect(result.skippedCount).toBe(1);
    expect(result.confirmedMatches).toEqual([]);
    expect(result.possibleMatches).toHaveLength(1);
  });
});
