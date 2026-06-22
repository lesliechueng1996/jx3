import { describe, expect, it } from 'vitest';
import type { RaidRunListItem } from '#/lib/api/raid-runs-api';
import {
  formatWeekGroupLabel,
  getRaidHistorySortTime,
  groupRaidHistoryByWeek,
} from '#/routes/_app/raids/history/-components/raid-history-utils';

const createLocalDate = (
  year: number,
  month: number,
  day: number,
  hour = 0,
): Date => new Date(year, month - 1, day, hour, 0, 0, 0);

const createItem = (
  id: string,
  startTime: string | null,
  createdAt = '2026-06-01T00:00:00.000Z',
): RaidRunListItem => ({
  id,
  name: `团队 ${id}`,
  status: 'completed',
  dungeonId: null,
  dungeonName: '测试副本',
  gatherTime: null,
  startTime,
  endTime: null,
  createdAt,
  isCreator: false,
  mySignup: null,
});

describe('raid-history-utils week grouping', () => {
  it('uses startTime, then gatherTime, then createdAt for sorting', () => {
    const item = createItem('1', '2026-06-15T12:00:00.000Z');
    expect(getRaidHistorySortTime(item)).toBe(
      new Date('2026-06-15T12:00:00.000Z').getTime(),
    );

    const fallbackItem: RaidRunListItem = {
      ...item,
      startTime: null,
      gatherTime: '2026-06-14T11:00:00.000Z',
    };
    expect(getRaidHistorySortTime(fallbackItem)).toBe(
      new Date('2026-06-14T11:00:00.000Z').getTime(),
    );
  });

  it('labels current and previous weeks', () => {
    const now = createLocalDate(2026, 6, 22, 12);
    const thisWeekStart = createLocalDate(2026, 6, 22);
    const lastWeekStart = createLocalDate(2026, 6, 15);

    expect(formatWeekGroupLabel(thisWeekStart, now)).toBe('本周');
    expect(formatWeekGroupLabel(lastWeekStart, now)).toBe('上周');
  });

  it('groups items by calendar week and keeps newest weeks first', () => {
    const now = createLocalDate(2026, 6, 22, 12);
    const groups = groupRaidHistoryByWeek(
      [
        createItem('older', createLocalDate(2026, 6, 10, 20).toISOString()),
        createItem('last-week', createLocalDate(2026, 6, 17, 20).toISOString()),
        createItem(
          'this-week-1',
          createLocalDate(2026, 6, 22, 20).toISOString(),
        ),
        createItem(
          'this-week-2',
          createLocalDate(2026, 6, 24, 20).toISOString(),
        ),
      ],
      now,
    );

    expect(groups).toHaveLength(3);
    expect(groups[0]?.label).toBe('本周');
    expect(groups[0]?.items.map((item) => item.id)).toEqual([
      'this-week-1',
      'this-week-2',
    ]);
    expect(groups[1]?.label).toBe('上周');
    expect(groups[1]?.items.map((item) => item.id)).toEqual(['last-week']);
    expect(groups[2]?.items.map((item) => item.id)).toEqual(['older']);
  });
});
