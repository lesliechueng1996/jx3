import { describe, expect, it } from 'bun:test';
import type { GameServerState } from '@jx3/jx3api';
import { mapGameServerStateToCreateBody } from '../../src/services/game-servers-admin';

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

describe('mapGameServerStateToCreateBody', () => {
  it('maps jx3box server state to create body', () => {
    expect(mapGameServerStateToCreateBody(baseState)).toEqual({
      serverId: '唯我独尊',
      zone: '电信区',
      name: '唯我独尊',
      alias: [],
    });
  });

  it('uses main server as alias when it differs from server name', () => {
    expect(
      mapGameServerStateToCreateBody({
        ...baseState,
        serverName: '幽月轮',
        mainServer: '唯我独尊',
      }),
    ).toEqual({
      serverId: '幽月轮',
      zone: '电信区',
      name: '幽月轮',
      alias: ['唯我独尊'],
    });
  });
});
