import { describe, expect, it } from 'vitest';
import { Route } from '../../src/routes/__root';

describe('root route head', () => {
  it('defines document head metadata', () => {
    const head = Route.options.head?.({} as never);

    expect(head?.meta).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ charSet: 'utf-8' }),
        expect.objectContaining({ title: 'JX3' }),
      ]),
    );
    expect(head?.links?.[0]).toEqual(
      expect.objectContaining({ rel: 'stylesheet' }),
    );
  });
});
