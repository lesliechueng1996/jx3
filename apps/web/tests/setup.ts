import { vi } from 'vitest';

vi.mock('@tanstack/react-start', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-start')>();

  return {
    ...actual,
    createIsomorphicFn: () => {
      let clientImpl: ((...args: unknown[]) => unknown) | undefined;

      const builder = {
        client(fn: (...args: unknown[]) => unknown) {
          clientImpl = fn;
          return builder;
        },
        server(fn: (...args: unknown[]) => unknown) {
          return async (...args: unknown[]) => {
            if (typeof window !== 'undefined' && clientImpl) {
              return clientImpl(...args);
            }
            return fn(...args);
          };
        },
      };

      return builder;
    },
  };
});
