import { afterEach, describe, expect, it, mock } from 'bun:test';
import type { Jx3ApiError } from '../../../src/errors';
import { getItemIconByName } from '../../../src/providers/jx3box/icon-by-name';
import type { Jx3boxIconByNameRaw } from '../../../src/providers/jx3box/types/icon-by-name';
import { stubGlobalFetch } from '../../helpers/mock-fetch';

const originalFetch = globalThis.fetch;

const sampleRaw: Jx3boxIconByNameRaw = {
  item: [{ iconID: 22889, Name: '第一尊' }],
  buff: [],
  skill: [],
};

afterEach(() => {
  globalThis.fetch = originalFetch;
  mock.restore();
});

describe('getItemIconByName', () => {
  it('fetches icon ID by name and returns normalized icon URL', async () => {
    stubGlobalFetch((url) => {
      expect(url).toBe(
        'https://node.jx3box.com/icon/name/%E7%AC%AC%E4%B8%80%E5%B0%8A?client=std',
      );
      return Promise.resolve(
        new Response(JSON.stringify(sampleRaw), { status: 200 }),
      );
    });

    const icon = await getItemIconByName('第一尊');

    expect(icon).toEqual({
      iconId: 22889,
      name: '第一尊',
      iconUrl: 'https://icon.jx3box.com/icon/22889.png',
    });
  });

  it('throws NOT_FOUND when upstream returns no matching item', async () => {
    stubGlobalFetch(() => {
      return Promise.resolve(
        new Response(JSON.stringify({ item: [], buff: [], skill: [] }), {
          status: 200,
        }),
      );
    });

    await expect(getItemIconByName('不存在')).rejects.toMatchObject({
      name: 'Jx3ApiError',
      code: 'NOT_FOUND',
    } satisfies Partial<Jx3ApiError>);
  });
});
