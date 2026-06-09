import { afterEach, describe, expect, it, mock } from 'bun:test';
import { Jx3ApiError } from '../../../src/errors';
import { searchGameServer } from '../../../src/providers/jx3api/master-search';
import type {
  Jx3apiEnvelopeRaw,
  Jx3apiMasterSearchDataRaw,
} from '../../../src/providers/jx3api/types/master-search';
import { stubGlobalFetch } from '../../helpers/mock-fetch';

const originalFetch = globalThis.fetch;

const sampleData: Jx3apiMasterSearchDataRaw = {
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
  slave: ['梦江南', '枫泾古镇', '如梦令'],
};

const sampleEnvelope: Jx3apiEnvelopeRaw<Jx3apiMasterSearchDataRaw> = {
  code: 200,
  msg: 'success',
  data: sampleData,
  time: 1781029187,
};

afterEach(() => {
  globalThis.fetch = originalFetch;
  mock.restore();
});

describe('searchGameServer', () => {
  it('fetches and normalizes server detail from jx3api', async () => {
    stubGlobalFetch((url) => {
      expect(url).toBe(
        'https://www.jx3api.com/data/master/search?name=%E6%A2%A6%E6%B1%9F%E5%8D%97',
      );
      return Promise.resolve(
        new Response(JSON.stringify(sampleEnvelope), { status: 200 }),
      );
    });

    const server = await searchGameServer('梦江南');

    expect(server).toEqual({
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
    });
  });

  it('throws Jx3ApiError when upstream returns non-200 code', async () => {
    stubGlobalFetch(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            code: 404,
            msg: 'server not found',
            data: null,
            time: 1781029187,
          }),
          { status: 200 },
        ),
      ),
    );

    await expect(searchGameServer('unknown')).rejects.toEqual(
      new Jx3ApiError('server not found', { code: 'UPSTREAM_ERROR' }),
    );
  });
});
