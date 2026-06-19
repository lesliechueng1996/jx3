import { describe, expect, it } from 'bun:test';
import { buildItemIconUrl } from '../../../../src/providers/jx3box/config';
import { mapItemIcon } from '../../../../src/providers/jx3box/types/icon-by-name';

describe('mapItemIcon', () => {
  it('maps raw item icon fields to normalized shape', () => {
    expect(
      mapItemIcon({
        iconID: 22889,
        Name: '第一尊',
      }),
    ).toEqual({
      iconId: 22889,
      name: '第一尊',
      iconUrl: buildItemIconUrl(22889),
    });
  });
});
