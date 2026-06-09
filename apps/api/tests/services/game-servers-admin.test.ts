import { describe, expect, it } from 'bun:test';
import type { GameServerDetail, GameServerState } from '@jx3/jx3api';
import {
  collectUniqueServerNames,
  mapGameServerDetailToCreateBody,
} from '../../src/services/game-servers-admin';

const baseState: GameServerState = {
  zoneName: '电信区',
  serverName: '唯我独尊',
  ipAddress: '109.244.61.89',
  ipPort: '3724',
  channel: 'zhcn_hd',
  connectState: true,
  heat: '8',
  maintainTime: 1780283421,
  delay: 80,
  mainServer: '唯我独尊',
};

const baseDetail: GameServerDetail = {
  id: '0502',
  center: '24',
  zone: '电信区',
  name: '梦江南',
  event: 36,
  voice: {
    浩气盟: [32968],
    恶人谷: [36911],
  },
  alias: ['双梦镇', '双梦'],
  slaveServers: ['梦江南', '枫泾古镇', '如梦令'],
};

describe('mapGameServerDetailToCreateBody', () => {
  it('maps jx3api server detail to create body', () => {
    expect(mapGameServerDetailToCreateBody(baseDetail)).toEqual({
      serverId: '0502',
      zone: '电信区',
      name: '梦江南',
      alias: ['双梦镇', '双梦'],
    });
  });
});

describe('collectUniqueServerNames', () => {
  it('deduplicates server names from jx3box states', () => {
    expect(
      collectUniqueServerNames([
        baseState,
        { ...baseState, zoneName: '网通区' },
        { ...baseState, serverName: '幽月轮', mainServer: '幽月轮' },
      ]),
    ).toEqual(['唯我独尊', '幽月轮']);
  });
});
