import { describe, expect, it } from "vitest";

import { createAsyncOperationQueue } from "./operation-queue";

function createDeferredPromise() {
  let resolvePromise: (() => void) | undefined;
  const promise = new Promise<void>((resolve) => {
    resolvePromise = resolve;
  });

  return {
    promise,
    resolve() {
      resolvePromise?.();
    },
  };
}

describe("data sync operation queue", () => {
  it("defers a listener upload until bootstrap upload and download finish", async () => {
    const queue = createAsyncOperationQueue();
    const bootstrapUpload = createDeferredPromise();
    const events: string[] = [];

    const initialUploadPromise = queue.run(async () => {
      events.push("bootstrap-upload-started");
      await bootstrapUpload.promise;
      events.push("bootstrap-upload-finished");
    });
    const downloadPromise = queue.run(async () => {
      events.push("bootstrap-download");
    });
    const listenerUploadPromise = queue.run(async () => {
      events.push("listener-upload");
    });

    await Promise.resolve();
    expect(events).toEqual(["bootstrap-upload-started"]);

    bootstrapUpload.resolve();
    await Promise.all([
      initialUploadPromise,
      downloadPromise,
      listenerUploadPromise,
    ]);

    expect(events).toEqual([
      "bootstrap-upload-started",
      "bootstrap-upload-finished",
      "bootstrap-download",
      "listener-upload",
    ]);
  });

  it("continues processing after an operation fails", async () => {
    const queue = createAsyncOperationQueue();
    const failedOperation = queue.run(async () => {
      throw new Error("upload failed");
    });
    const nextOperation = queue.run(async () => "download completed");

    await expect(failedOperation).rejects.toThrow("upload failed");
    await expect(nextOperation).resolves.toBe("download completed");
  });
});
