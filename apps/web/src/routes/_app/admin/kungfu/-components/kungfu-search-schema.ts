import { z } from 'zod';
import {
  ATTACK_METHODS,
  ATTACK_TYPES,
  FORMATION_RECOMMEND_FILTERS,
  KUNGFU_TYPES,
} from '#/lib/api/admin/kungfu-admin-api';
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
} from '#/routes/_app/admin/-components/admin-list-search';

const optionalTrimmedString = z
  .string()
  .optional()
  .transform((value) => {
    const trimmed = value?.trim();
    return trimmed ? trimmed : undefined;
  });

const optionalBoolean = z
  .enum(['true', 'false'])
  .optional()
  .transform((value) => (value === undefined ? undefined : value === 'true'));

export const kungfuSearchSchema = z.object({
  page: z.coerce.number().int().min(1).catch(DEFAULT_PAGE),
  pageSize: z.coerce.number().int().min(1).catch(DEFAULT_PAGE_SIZE),
  name: optionalTrimmedString,
  schoolId: optionalTrimmedString,
  kungfuType: z.enum(KUNGFU_TYPES).optional(),
  attackType: z.enum(ATTACK_TYPES).optional(),
  attackMethod: z.enum(ATTACK_METHODS).optional(),
  formationRecommend: z.enum(FORMATION_RECOMMEND_FILTERS).optional(),
  isUnlimited: optionalBoolean,
});

export type KungfuSearch = z.infer<typeof kungfuSearchSchema>;

export const DEFAULT_KUNGFU_SEARCH: KungfuSearch = {
  page: DEFAULT_PAGE,
  pageSize: DEFAULT_PAGE_SIZE,
  name: undefined,
  schoolId: undefined,
  kungfuType: undefined,
  attackType: undefined,
  attackMethod: undefined,
  formationRecommend: undefined,
  isUnlimited: undefined,
};
