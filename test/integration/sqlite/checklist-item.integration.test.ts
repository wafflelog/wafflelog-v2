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

vi.mock("@/lib/supabase/actions", () => ({
  actionSoftDeleteRemoteChecklistItem: vi.fn(),
  actionUpdateRemoteChecklistItemFromLocal: vi.fn(),
  actionUpsertRemoteChecklistItemFromLocal: vi.fn(),
}));

describe("local checklist items", () => {
  beforeEach(async () => {
    testDb = createTestSqliteDatabase();
    const { initializeDatabase } = await import("@/lib/sqlite/init");
    await initializeDatabase();
  });

  afterEach(() => {
    testDb.close();
  });

  it("creates pending items and lists only active items for the requested trip", async () => {
    const {
      actionCreateLocalChecklistItem,
      actionListLocalChecklistItems,
    } = await import("@/lib/sqlite/model/checklist-item");

    const first = await actionCreateLocalChecklistItem({
      tripId: "trip-a",
      userId: "user-a",
      title: "  Pack passport  ",
    });
    const second = await actionCreateLocalChecklistItem({
      tripId: "trip-a",
      userId: "user-b",
      title: "Book train",
    });
    const otherTrip = await actionCreateLocalChecklistItem({
      tripId: "trip-b",
      userId: "user-a",
      title: "Do not show",
    });

    await testDb.runAsync(
      "update checklist_item set created_at = ? where id = ?",
      ["2026-01-01T09:00:00.000Z", first.id],
    );
    await testDb.runAsync(
      "update checklist_item set created_at = ? where id = ?",
      ["2026-01-02T09:00:00.000Z", second.id],
    );
    await testDb.runAsync(
      "update checklist_item set deleted_at = ? where id = ?",
      ["2026-01-03T09:00:00.000Z", otherTrip.id],
    );
    await testDb.runAsync(
      "insert into user_profile (id, username, updated_at) values (?, ?, ?)",
      ["user-a", "alice", "2026-01-01T00:00:00.000Z"],
    );
    await testDb.runAsync(
      "insert into user_profile (id, username, updated_at) values (?, ?, ?)",
      ["user-b", "bob", "2026-01-01T00:00:00.000Z"],
    );

    expect(first).toMatchObject({
      title: "Pack passport",
      completed: false,
      syncStatus: "pending",
      lastSyncedAt: null,
      syncError: null,
      deletedAt: null,
    });

    await expect(actionListLocalChecklistItems("trip-a", "user-a")).resolves.toEqual([
      expect.objectContaining({
        id: first.id,
        title: "Pack passport",
        creator: { userId: "user-a", username: "alice", isCurrentUser: true },
      }),
      expect.objectContaining({
        id: second.id,
        title: "Book train",
        creator: { userId: "user-b", username: "bob", isCurrentUser: false },
      }),
    ]);
  });

  it("toggles completion and returns a changed item to the pending sync state", async () => {
    const {
      actionCreateLocalChecklistItem,
      actionListLocalChecklistItems,
      actionToggleLocalChecklistItemCompleted,
    } = await import("@/lib/sqlite/model/checklist-item");
    const item = await actionCreateLocalChecklistItem({
      tripId: "trip-a",
      userId: "user-a",
      title: "Pack charger",
    });

    await testDb.runAsync(
      "update checklist_item set sync_status = ?, sync_error = ? where id = ?",
      ["failed", "Previous sync failed", item.id],
    );
    await actionToggleLocalChecklistItemCompleted(item.id);

    await expect(actionListLocalChecklistItems("trip-a", "user-a")).resolves.toEqual([
      expect.objectContaining({
        id: item.id,
        completed: true,
        syncStatus: "pending",
        syncError: null,
      }),
    ]);

    await actionToggleLocalChecklistItemCompleted(item.id);
    await expect(actionListLocalChecklistItems("trip-a", "user-a")).resolves.toEqual([
      expect.objectContaining({ id: item.id, completed: false }),
    ]);
  });

  it("only lets the owner delete a local checklist item", async () => {
    const {
      actionCreateLocalChecklistItem,
      actionHardDeleteLocalChecklistItem,
      actionListLocalChecklistItems,
      actionSoftDeleteLocalChecklistItem,
    } = await import("@/lib/sqlite/model/checklist-item");
    const item = await actionCreateLocalChecklistItem({
      tripId: "trip-a",
      userId: "user-a",
      title: "Reserve museum tickets",
    });

    await actionSoftDeleteLocalChecklistItem(item.id, "user-b");
    await expect(actionListLocalChecklistItems("trip-a", "user-a")).resolves.toHaveLength(
      1,
    );

    await actionHardDeleteLocalChecklistItem(item.id, "user-b");
    await expect(actionListLocalChecklistItems("trip-a", "user-a")).resolves.toHaveLength(
      1,
    );

    await actionSoftDeleteLocalChecklistItem(item.id, "user-a");
    await expect(actionListLocalChecklistItems("trip-a", "user-a")).resolves.toEqual([]);

    await actionHardDeleteLocalChecklistItem(item.id, "user-a");
    await expect(
      testDb.getFirstAsync<{ id: string }>(
        "select id from checklist_item where id = ?",
        [item.id],
      ),
    ).resolves.toBeNull();
  });

  it("selects the oldest pending rows the user owns or can access as an active companion", async () => {
    const {
      actionCreateLocalChecklistItem,
      actionListPendingLocalChecklistItems,
    } = await import("@/lib/sqlite/model/checklist-item");
    const ownOldest = await actionCreateLocalChecklistItem({
      tripId: "trip-owned",
      userId: "user-a",
      title: "Own oldest",
    });
    const companionMiddle = await actionCreateLocalChecklistItem({
      tripId: "trip-companion",
      userId: "user-b",
      title: "Companion middle",
    });
    const ownNewest = await actionCreateLocalChecklistItem({
      tripId: "trip-owned",
      userId: "user-a",
      title: "Own newest",
    });
    const synced = await actionCreateLocalChecklistItem({
      tripId: "trip-owned",
      userId: "user-a",
      title: "Already synced",
    });
    const inactiveCompanion = await actionCreateLocalChecklistItem({
      tripId: "trip-inactive",
      userId: "user-b",
      title: "Inactive companion",
    });

    for (const [id, createdAt] of [
      [ownOldest.id, "2026-01-01T09:00:00.000Z"],
      [companionMiddle.id, "2026-01-02T09:00:00.000Z"],
      [ownNewest.id, "2026-01-03T09:00:00.000Z"],
      [synced.id, "2026-01-04T09:00:00.000Z"],
      [inactiveCompanion.id, "2026-01-05T09:00:00.000Z"],
    ]) {
      await testDb.runAsync(
        "update checklist_item set created_at = ? where id = ?",
        [createdAt, id],
      );
    }
    await testDb.runAsync(
      "update checklist_item set sync_status = 'synced' where id = ?",
      [synced.id],
    );
    await testDb.runAsync(
      `insert into trip_membership
        (trip_id, user_id, role, status, source, created_at, updated_at, last_synced_at)
       values (?, ?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        "trip-companion",
        "user-a",
        "companion",
        "active",
        "remote",
        "2026-01-01T00:00:00.000Z",
        "2026-01-01T00:00:00.000Z",
        null,
        "trip-inactive",
        "user-a",
        "companion",
        "pending",
        "remote",
        "2026-01-01T00:00:00.000Z",
        "2026-01-01T00:00:00.000Z",
        null,
      ],
    );

    await expect(actionListPendingLocalChecklistItems("user-a", 2)).resolves.toEqual([
      expect.objectContaining({ id: ownOldest.id }),
      expect.objectContaining({ id: companionMiddle.id }),
    ]);
    await expect(actionListPendingLocalChecklistItems("user-a")).resolves.toEqual([
      expect.objectContaining({ id: ownOldest.id }),
      expect.objectContaining({ id: companionMiddle.id }),
      expect.objectContaining({ id: ownNewest.id }),
    ]);
  });
});
