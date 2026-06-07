export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 10;

export function toRouteSearch<T extends Record<string, unknown>>(
  filters: T,
  defaults: T,
): Partial<T> {
  const result: Partial<T> = {};
  const keys = new Set([
    ...Object.keys(defaults),
    ...Object.keys(filters),
  ]) as Set<keyof T>;

  for (const key of keys) {
    const value = filters[key];
    const defaultValue = defaults[key];

    if (value === undefined || value === null || value === '') {
      result[key] = undefined;
      continue;
    }

    if (value === defaultValue) {
      result[key] = undefined;
      continue;
    }

    result[key] = value;
  }

  return result;
}
