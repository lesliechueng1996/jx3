import type { z } from 'zod';
import type {
  itemQualitySchema,
  itemTypeSchema,
} from '#/lib/api/game-items-api';

export type ItemQuality = z.infer<typeof itemQualitySchema>;
export type ItemType = z.infer<typeof itemTypeSchema>;

export const ITEM_TYPE_LABELS: Record<ItemType, string> = {
  equipment: '装备',
  special: '特殊',
};

export const ITEM_QUALITY_LABELS: Record<ItemQuality, string> = {
  white: '白',
  green: '绿',
  blue: '蓝',
  purple: '紫',
  orange: '橙',
};

export const ITEM_QUALITY_CLASS: Record<ItemQuality, string> = {
  white: 'text-muted-foreground',
  green: 'text-green-600',
  blue: 'text-blue-600',
  purple: 'text-purple-600',
  orange: 'text-orange-500',
};

export const formatGoldAmount = (value: string | number | null): string => {
  if (value === null || value === '') {
    return '—';
  }

  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) {
    return String(value);
  }

  return numeric.toLocaleString('zh-CN');
};

export const countNamedSignups = (
  signups: Array<{ characterName: string | null }>,
): number => signups.filter((signup) => signup.characterName?.trim()).length;

export const computeWagePerPerson = (
  totalIncome: string,
  participantCount: number,
): string | null => {
  if (!totalIncome.trim() || participantCount <= 0) {
    return null;
  }

  const total = Number(totalIncome);
  if (!Number.isFinite(total) || total < 0) {
    return null;
  }

  const perPerson = total / participantCount;
  return Number.isInteger(perPerson) ? String(perPerson) : perPerson.toFixed(2);
};
