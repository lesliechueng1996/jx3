import { afterEach, describe, expect, it, mock } from 'bun:test';
import { getServerStates } from '../../../src/providers/jx3box/server-state';
import type { Jx3boxServerStateRaw } from '../../../src/providers/jx3box/types/server-state';
import { stubGlobalFetch } from '../../helpers/mock-fetch';

const originalFetch = globalThis.fetch;

const sampleRaw: Jx3boxServerStateRaw[] = [
  {
    zone_name: '电信区',
    server_name: '唯我独尊',
    ip_address: '109.244.61.89',
    ip_port: '3724',
    channel: 'zhcn_hd',
    connect_state: true,
    heat: '8',
    maintain_time: 1780283421,
    delay: 80,
    main_server: '唯我独尊',
  },
];

afterEach(() => {
  globalThis.fetch = originalFetch;
  mock.restore();
});

describe('getServerStates', () => {
  it('fetches and normalizes server state from jx3box', async () => {
    stubGlobalFetch((url) => {
      expect(url).toBe(
        'https://spider2.jx3box.com/api/spider/server/server_state',
      );
      return Promise.resolve(
        new Response(JSON.stringify(sampleRaw), { status: 200 }),
      );
    });

    const servers = await getServerStates();

    expect(servers).toHaveLength(1);
    expect(servers[0]).toEqual({
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
    });
  });
});
