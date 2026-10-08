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

describe("local data sync state", () => {
  beforeEach(async () => {
    testDb = createTestSqliteDatabase();

    const { initializeDatabase } = await import("@/lib/sqlite/init");
    await initializeDatabase();
  });

  afterEach(() => {
    testDb.close();
  });

  it("tracks initial download completion independently for each user", async () => {
    const {
      actionGetInitialDownloadCompletedAt,
      actionMarkInitialDownloadCompleted,
    } = await import("@/lib/sqlite/model/data-sync-state");

    await expect(
      actionGetInitialDownloadCompletedAt("user-a"),
    ).resolves.toBeNull();

    const firstCompletedAt = await actionMarkInitialDownloadCompleted("user-a");

    await expect(
      actionGetInitialDownloadCompletedAt("user-a"),
    ).resolves.toBe(firstCompletedAt);
    await expect(
      actionGetInitialDownloadCompletedAt("user-b"),
    ).resolves.toBeNull();
  });

  it("updates an existing user's completion timestamp without duplication", async () => {
    const { actionMarkInitialDownloadCompleted } = await import(
      "@/lib/sqlite/model/data-sync-state"
    );

    await actionMarkInitialDownloadCompleted("user-a");
    await actionMarkInitialDownloadCompleted("user-a");

    await expect(
      testDb.getAllAsync<{ user_id: string }>(
        "select user_id from data_sync_state",
      ),
    ).resolves.toEqual([{ user_id: "user-a" }]);
  });
});
