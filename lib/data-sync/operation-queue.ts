export type AsyncOperationQueue = {
  run: <Result>(operation: () => Promise<Result>) => Promise<Result>;
};

export function createAsyncOperationQueue(): AsyncOperationQueue {
  let pendingOperation: Promise<void> = Promise.resolve();

  return {
    run<Result>(operation: () => Promise<Result>) {
      const result = pendingOperation.then(operation, operation);

      pendingOperation = result.then(
        () => undefined,
        () => undefined,
      );

      return result;
    },
  };
}
