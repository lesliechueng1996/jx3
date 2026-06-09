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
const fetchMasterSearchEnvelope = (
  name: string,
  options: SearchGameServerOptions = {},
) => {
  const url = `${JX3API_BASE_URL}${MASTER_SEARCH_PATH}?name=${encodeURIComponent(name)}`;
  return fetchJson<Jx3apiEnvelopeRaw<Jx3apiMasterSearchDataRaw>>(url, {
    logger: options.logger,
  });
};

/**
 * Looks up JX3 game server details by name. Returns null when upstream
 * responds with code 400 (server not found).
 */
export async function trySearchGameServer(
  name: string,
  options: SearchGameServerOptions = {},
): Promise<GameServerDetail | null> {
  const envelope = await fetchMasterSearchEnvelope(name, options);

  if (envelope.code === 400) {
    return null;
  }

  if (envelope.code !== 200) {
    throw new Jx3ApiError(envelope.msg || 'Upstream API returned an error', {
      code: 'UPSTREAM_ERROR',
    });
  }

  return mapMasterSearchData(envelope.data);
}

export async function searchGameServer(
  name: string,
  options: SearchGameServerOptions = {},
): Promise<GameServerDetail> {
  const envelope = await fetchMasterSearchEnvelope(name, options);

  if (envelope.code !== 200) {
    throw new Jx3ApiError(envelope.msg || 'Upstream API returned an error', {
      code: 'UPSTREAM_ERROR',
    });
  }

  return mapMasterSearchData(envelope.data);
}
