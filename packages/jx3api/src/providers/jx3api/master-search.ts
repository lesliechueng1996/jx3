import type { Logger } from '@jx3/logger';
import { fetchJson } from '../../client';
import { Jx3ApiError } from '../../errors';
import { JX3API_BASE_URL } from './config';
import {
  type GameServerDetail,
  type Jx3apiEnvelopeRaw,
  type Jx3apiMasterSearchDataRaw,
  mapMasterSearchData,
} from './types/master-search';

const MASTER_SEARCH_PATH = '/data/master/search';

export interface SearchGameServerOptions {
  logger?: Logger;
}

/**
 * Searches JX3 game server details by server name via jx3api.com.
 * No authentication required.
 *
 * @see https://www.jx3api.com/data/master/search?name={name}
 */
export async function searchGameServer(
  name: string,
  options: SearchGameServerOptions = {},
): Promise<GameServerDetail> {
  const url = `${JX3API_BASE_URL}${MASTER_SEARCH_PATH}?name=${encodeURIComponent(name)}`;
  const envelope = await fetchJson<
    Jx3apiEnvelopeRaw<Jx3apiMasterSearchDataRaw>
  >(url, { logger: options.logger });

  if (envelope.code !== 200) {
    throw new Jx3ApiError(envelope.msg || 'Upstream API returned an error', {
      code: 'UPSTREAM_ERROR',
    });
  }

  return mapMasterSearchData(envelope.data);
}
