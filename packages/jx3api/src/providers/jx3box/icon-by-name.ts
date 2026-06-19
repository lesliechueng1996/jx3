import type { Logger } from '@jx3/logger';
import { fetchJson } from '../../client';
import { Jx3ApiError } from '../../errors';
import { JX3BOX_NODE_BASE_URL } from './config';
import {
  type ItemIcon,
  type Jx3boxIconByNameRaw,
  mapItemIcon,
} from './types/icon-by-name';

const ICON_BY_NAME_PATH = '/icon/name';

export interface GetItemIconByNameOptions {
  logger?: Logger;
}

/**
 * Resolves a JX3 item icon URL by item name via jx3box node API.
 * No authentication required.
 *
 * @see https://node.jx3box.com/icon/name/{name}?client=std
 */
export async function getItemIconByName(
  name: string,
  options: GetItemIconByNameOptions = {},
): Promise<ItemIcon> {
  const url = `${JX3BOX_NODE_BASE_URL}${ICON_BY_NAME_PATH}/${encodeURIComponent(name)}?client=std`;
  const raw = await fetchJson<Jx3boxIconByNameRaw>(url, {
    logger: options.logger,
  });

  const firstItem = raw.item[0];

  if (!firstItem) {
    throw new Jx3ApiError(`No icon found for item "${name}"`, {
      code: 'NOT_FOUND',
    });
  }

  return mapItemIcon(firstItem);
}
