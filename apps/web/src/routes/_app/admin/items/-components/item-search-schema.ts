import { z } from 'zod';
import {
  ITEM_QUALITIES,
  ITEM_TYPES,
} from '#/lib/api/admin/game-items-admin-api';
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

export const itemSearchSchema = z.object({
  page: z.coerce.number().int().min(1).catch(DEFAULT_PAGE),
  pageSize: z.coerce.number().int().min(1).catch(DEFAULT_PAGE_SIZE),
  name: optionalTrimmedString,
  type: z.enum(ITEM_TYPES).optional(),
  quality: z.enum(ITEM_QUALITIES).optional(),
  alias: optionalTrimmedString,
});

export type ItemSearch = z.infer<typeof itemSearchSchema>;

export const DEFAULT_ITEM_SEARCH: ItemSearch = {
  page: DEFAULT_PAGE,
  pageSize: DEFAULT_PAGE_SIZE,
  name: undefined,
  type: undefined,
  quality: undefined,
  alias: undefined,
};
