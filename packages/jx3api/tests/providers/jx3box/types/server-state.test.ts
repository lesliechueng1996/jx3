import { describe, expect, it } from 'bun:test';
import {
  type Jx3boxServerStateRaw,
  mapServerState,
} from '../../../../src/providers/jx3box/types/server-state';

describe('mapServerState', () => {
  it('maps snake_case API fields to camelCase', () => {
    const raw: Jx3boxServerStateRaw = {
      zone_name: '双线区',
      server_name: '飞龙在天',
      ip_address: '109.244.62.130',
      ip_port: '3724',
      channel: 'zhcn_hd',
      connect_state: true,
      heat: '6',
      maintain_time: 1780283421,
      delay: 61,
      main_server: '飞龙在天',
    };

    expect(mapServerState(raw)).toEqual({
      zoneName: '双线区',
      serverName: '飞龙在天',
      ipAddress: '109.244.62.130',
      ipPort: '3724',
      channel: 'zhcn_hd',
      connectState: true,
      heat: '6',
      maintainTime: 1780283421,
      delay: 61,
      mainServer: '飞龙在天',
    });
  });
});
