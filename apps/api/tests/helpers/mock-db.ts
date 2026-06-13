export type MockDb = {
  setResults: (results: unknown[][]) => void;
  reset: () => void;
  select: (...args: unknown[]) => object;
  insert: (...args: unknown[]) => { values: (...values: unknown[]) => object };
  update: (...args: unknown[]) => { set: (...values: unknown[]) => object };
  delete: (...args: unknown[]) => object;
  transaction: <T>(fn: (tx: MockDb) => Promise<T>) => Promise<T>;
};

type ThenableChain = {
  then: (
    onFulfilled?: (value: unknown) => unknown,
    onRejected?: (reason: unknown) => unknown,
  ) => Promise<unknown>;
};

const buildChain = (nextResult: () => unknown): object => {
  const chain: ThenableChain = {
    // Drizzle query builders are awaited directly; this thenable stub is intentional.
    // biome-ignore lint/suspicious/noThenProperty: mock thenable chain for drizzle await
    then(onFulfilled, onRejected) {
      return Promise.resolve(nextResult()).then(onFulfilled, onRejected);
    },
  };

  return new Proxy(chain, {
    get(target, prop) {
      if (prop === 'then') {
        return target.then.bind(target);
      }

      return (..._args: unknown[]) => buildChain(nextResult);
    },
  });
};

export const createMockDb = (initialResults: unknown[][] = []): MockDb => {
  let results = initialResults;
  let index = 0;

  const nextResult = () => results[index++] ?? [];

  const db: MockDb = {
    setResults(nextResults: unknown[][]) {
      results = nextResults;
      index = 0;
    },
    reset() {
      index = 0;
    },
    select: (..._args: unknown[]) => buildChain(nextResult),
    insert: (..._args: unknown[]) => ({
      values: (..._values: unknown[]) => buildChain(nextResult),
    }),
    update: (..._args: unknown[]) => ({
      set: (..._values: unknown[]) => buildChain(nextResult),
    }),
    delete: (..._args: unknown[]) => buildChain(nextResult),
    transaction: async <T>(fn: (tx: MockDb) => Promise<T>): Promise<T> =>
      fn(db),
  };

  return db;
};
