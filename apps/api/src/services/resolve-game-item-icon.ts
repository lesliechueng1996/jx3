import { getItemIconByName, Jx3ApiError } from '@jx3/jx3api';
import type { Logger } from '@jx3/logger';

export const resolveGameItemIcon = async (
  name: string,
  icon: string | null | undefined,
  options: { logger?: Logger } = {},
): Promise<string | null> => {
  if (icon !== undefined) {
    return icon;
  }

  try {
    const lookup = await getItemIconByName(name, { logger: options.logger });
    return lookup.iconUrl;
  } catch (error) {
    if (error instanceof Jx3ApiError && error.code === 'NOT_FOUND') {
      return null;
    }
    throw error;
  }
};
