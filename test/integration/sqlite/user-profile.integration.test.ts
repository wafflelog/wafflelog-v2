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

describe("local user profiles", () => {
  beforeEach(async () => {
    testDb = createTestSqliteDatabase();
    const { initializeDatabase } = await import("@/lib/sqlite/init");
    await initializeDatabase();
  });

  afterEach(() => {
    testDb.close();
  });

  it("returns a cached owner profile by user ID", async () => {
    const {
      actionGetLocalUserProfile,
      actionUpsertLocalUserProfilesFromRemote,
    } = await import("@/lib/sqlite/model/user-profile");

    await actionUpsertLocalUserProfilesFromRemote([
      {
        id: "owner-a",
        username: "alice",
        updatedAt: "2026-10-21T12:00:00.000Z",
      },
    ]);

    await expect(actionGetLocalUserProfile("owner-a")).resolves.toEqual({
      id: "owner-a",
      username: "alice",
      updatedAt: "2026-10-21T12:00:00.000Z",
    });
    await expect(actionGetLocalUserProfile("missing-owner")).resolves.toBeNull();
  });
});
