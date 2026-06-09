import type { Logger } from '@jx3/logger';
import { fetchJson } from '../../client';
import { JX3BOX_SPIDER_BASE_URL } from './config';
import {
  type GameServerState,
  type Jx3boxServerStateRaw,
  mapServerState,
} from './types/server-state';

const SERVER_STATE_PATH = '/server/server_state';

export interface GetServerStatesOptions {
  logger?: Logger;
}

/**
 * Fetches live server status for all JX3 game servers from jx3box spider API.
 * No authentication required.
 *
 * @see https://spider2.jx3box.com/api/spider/server/server_state
 */
export async function getServerStates(
  options: GetServerStatesOptions = {},
): Promise<GameServerState[]> {
  const url = `${JX3BOX_SPIDER_BASE_URL}${SERVER_STATE_PATH}`;
  const raw = await fetchJson<Jx3boxServerStateRaw[]>(url, {
    logger: options.logger,
  });

  return raw.map(mapServerState);
}
