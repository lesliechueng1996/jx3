import { z } from 'zod';
import { buildQueryString } from '#/lib/api/build-query';
import { requestJson } from '#/lib/api/request';

export const KUNGFU_TYPES = ['defense', 'heal', 'attack'] as const;
export const ATTACK_TYPES = ['internal', 'external'] as const;
export const ATTACK_METHODS = ['melee', 'ranged'] as const;
export const FORMATION_RECOMMEND_FILTERS = [
  'external',
  'internal',
  'none',
] as const;

export type KungfuType = (typeof KUNGFU_TYPES)[number];
export type AttackType = (typeof ATTACK_TYPES)[number];
export type AttackMethod = (typeof ATTACK_METHODS)[number];
export type FormationRecommendFilter =
  (typeof FORMATION_RECOMMEND_FILTERS)[number];

export const KUNGFU_TYPE_LABELS: Record<KungfuType, string> = {
  defense: '防御',
  heal: '治疗',
  attack: '攻击',
};

export const ATTACK_TYPE_LABELS: Record<AttackType, string> = {
  internal: '内功',
  external: '外功',
};

export const ATTACK_METHOD_LABELS: Record<AttackMethod, string> = {
  melee: '近战',
  ranged: '远程',
};

export const FORMATION_RECOMMEND_FILTER_LABELS: Record<
  FormationRecommendFilter,
  string
> = {
  external: '外功阵眼',
  internal: '内功阵眼',
  none: '否',
};

export const kungfuTypeSchema = z.enum(KUNGFU_TYPES);
export const attackTypeSchema = z.enum(ATTACK_TYPES);
export const attackMethodSchema = z.enum(ATTACK_METHODS);

export const adminKungfuListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  schoolId: z.string(),
  schoolName: z.string(),
  kungfuType: kungfuTypeSchema,
  attackType: attackTypeSchema.nullable(),
  attackMethod: attackMethodSchema.nullable(),
  formationEffect: z.string().nullable(),
  isPveExternalRecommended: z.boolean(),
  isPveInternalRecommended: z.boolean(),
  isUnlimited: z.boolean(),
  icon: z.string().nullable(),
  alias: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type AdminKungfuListItem = z.infer<typeof adminKungfuListItemSchema>;

export const listKungfuResponseSchema = z.object({
  items: z.array(adminKungfuListItemSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
});

export type ListKungfuResponse = z.infer<typeof listKungfuResponseSchema>;

export type ListKungfuFilters = {
  page: number;
  pageSize: number;
  name?: string;
  schoolId?: string;
  kungfuType?: KungfuType;
  attackType?: AttackType;
  attackMethod?: AttackMethod;
  formationRecommend?: FormationRecommendFilter;
  isUnlimited?: boolean;
};

export type KungfuFormValues = {
  name: string;
  schoolId: string;
  kungfuType: KungfuType;
  attackType: AttackType | null;
  attackMethod: AttackMethod | null;
  formationEffect: string | null;
  isPveExternalRecommended: boolean;
  isPveInternalRecommended: boolean;
  isUnlimited: boolean;
  icon: string | null;
  alias: string[];
};

const buildKungfuQuery = (filters: ListKungfuFilters): string =>
  buildQueryString({
    page: filters.page,
    pageSize: filters.pageSize,
    name: filters.name,
    schoolId: filters.schoolId,
    kungfuType: filters.kungfuType,
    attackType: filters.attackType,
    attackMethod: filters.attackMethod,
    formationRecommend: filters.formationRecommend,
    isUnlimited:
      filters.isUnlimited === undefined
        ? undefined
        : String(filters.isUnlimited),
  });

export const kungfuAdminApi = {
  list(filters: ListKungfuFilters) {
    return requestJson(
      `/api/v1/kungfu?${buildKungfuQuery(filters)}`,
      listKungfuResponseSchema,
    );
  },
  create(body: KungfuFormValues) {
    return requestJson('/api/v1/kungfu', adminKungfuListItemSchema, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
  update(kungfuId: string, body: Partial<KungfuFormValues>) {
    return requestJson(
      `/api/v1/kungfu/${kungfuId}`,
      adminKungfuListItemSchema,
      {
        method: 'PATCH',
        body: JSON.stringify(body),
      },
    );
  },
  delete(kungfuId: string) {
    return requestJson(
      `/api/v1/kungfu/${kungfuId}`,
      z.object({ success: z.literal(true) }),
      { method: 'DELETE' },
    );
  },
};

export const kungfuAdminQueryKey = ['admin-kungfu'] as const;

export const parseAliasInput = (value: string): string[] =>
  value
    .split(/[,，]/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

export const formatAliasInput = (alias: string[]): string => alias.join('，');

export const formatBooleanLabel = (value: boolean): string =>
  value ? '是' : '否';

export const FORMATION_EFFECT_LEVEL_COUNT = 6;

export const FORMATION_EFFECT_LEVEL_LABELS = [
  '第一重',
  '第二重',
  '第三重',
  '第四重',
  '第五重',
  '第六重',
] as const;

export const emptyFormationEffectInputs = (): string[] =>
  Array.from({ length: FORMATION_EFFECT_LEVEL_COUNT }, () => '');

export const parseFormationEffectInput = (
  value: string | null,
): string[] => {
  if (!value) {
    return emptyFormationEffectInputs();
  }

  const lines = value.split('\n');
  return Array.from(
    { length: FORMATION_EFFECT_LEVEL_COUNT },
    (_, index) => lines[index] ?? '',
  );
};

export const serializeFormationEffectInput = (
  lines: string[],
): string | null => {
  const normalized = lines.map((line) => line.trim());
  if (normalized.every((line) => line.length === 0)) {
    return null;
  }
  return normalized.join('\n');
};
