import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createTestSqliteDatabase,
  type TestSqliteDatabase,
} from "./test-db";

let testDb: TestSqliteDatabase;

vi.mock("@/lib/sqlite/client", () => ({
  get sqlite() {
    return testDb;
  },
}));

describe("initial data synchronization", () => {
  beforeEach(async () => {
    testDb = createTestSqliteDatabase();

    const { initializeDatabase } = await import("@/lib/sqlite/init");
    await initializeDatabase();
  });

  afterEach(() => {
    testDb.close();
  });

  it("downloads and marks the first successful bootstrap", async () => {
    const { runInitialDataSync } = await import("@/lib/data-sync/bootstrap");
    const uploadPending = vi.fn().mockResolvedValue(undefined);
    const downloadKnownTrips = vi.fn().mockResolvedValue(undefined);

    await expect(
      runInitialDataSync("user-a", { uploadPending, downloadKnownTrips }),
    ).resolves.toBe(true);

    expect(uploadPending).toHaveBeenCalledOnce();
    expect(downloadKnownTrips).toHaveBeenCalledOnce();
    await expect(
      testDb.getFirstAsync<{ user_id: string }>(
        "select user_id from data_sync_state where user_id = ?",
        ["user-a"],
      ),
    ).resolves.toEqual({ user_id: "user-a" });
  });

  it("still uploads but skips downloading for a completed bootstrap", async () => {
    const { runInitialDataSync } = await import("@/lib/data-sync/bootstrap");
    const { actionMarkInitialDownloadCompleted } = await import(
      "@/lib/sqlite/model/data-sync-state"
    );
    const uploadPending = vi.fn().mockResolvedValue(undefined);
    const downloadKnownTrips = vi.fn().mockResolvedValue(undefined);
    await actionMarkInitialDownloadCompleted("user-a");

    await expect(
      runInitialDataSync("user-a", { uploadPending, downloadKnownTrips }),
    ).resolves.toBe(false);

    expect(uploadPending).toHaveBeenCalledOnce();
    expect(downloadKnownTrips).not.toHaveBeenCalled();
  });

  it("does not mark the bootstrap when downloading fails", async () => {
    const { runInitialDataSync } = await import("@/lib/data-sync/bootstrap");
    const uploadPending = vi.fn().mockResolvedValue(undefined);
    const downloadKnownTrips = vi
      .fn()
      .mockRejectedValue(new Error("network unavailable"));

    await expect(
      runInitialDataSync("user-a", { uploadPending, downloadKnownTrips }),
    ).rejects.toThrow("network unavailable");

    await expect(
      testDb.getFirstAsync(
        "select user_id from data_sync_state where user_id = ?",
        ["user-a"],
      ),
    ).resolves.toBeNull();
  });
});
