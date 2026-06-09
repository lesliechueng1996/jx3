import { describe, expect, it } from 'bun:test';
import {
  type Jx3apiMasterSearchDataRaw,
  mapMasterSearchData,
} from '../../../../src/providers/jx3api/types/master-search';

describe('mapMasterSearchData', () => {
  it('maps upstream fields to normalized game server detail', () => {
    const raw: Jx3apiMasterSearchDataRaw = {
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

    expect(mapMasterSearchData(raw)).toEqual({
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
});
