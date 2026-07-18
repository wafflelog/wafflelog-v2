import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createTestSqliteDatabase,
  type TestSqliteDatabase,
} from "./test-db";

const remote = vi.hoisted(() => ({
  softDelete: vi.fn(),
  update: vi.fn(),
  upsert: vi.fn(),
}));

let testDb: TestSqliteDatabase;

vi.mock("@/lib/sqlite/client", () => ({
  get sqlite() {
    return testDb;
  },
}));

vi.mock("@/lib/supabase/actions", () => ({
  actionSoftDeleteRemoteChecklistItem: remote.softDelete,
  actionUpdateRemoteChecklistItemFromLocal: remote.update,
  actionUpsertRemoteChecklistItemFromLocal: remote.upsert,
}));

async function getSyncState(id: string) {
  return testDb.getFirstAsync<{
    sync_status: string;
    last_synced_at: string | null;
    sync_error: string | null;
  }>(
    "select sync_status, last_synced_at, sync_error from checklist_item where id = ?",
    [id],
  );
}

describe("checklist-item sync", () => {
  beforeEach(async () => {
    testDb = createTestSqliteDatabase();
    remote.softDelete.mockReset();
    remote.update.mockReset();
    remote.upsert.mockReset();

    const { initializeDatabase } = await import("@/lib/sqlite/init");
    await initializeDatabase();
  });

  afterEach(() => {
    testDb.close();
  });

  it("upserts a new item remotely and marks the local row synced", async () => {
    remote.upsert.mockResolvedValue(undefined);
    const { actionCreateLocalChecklistItem, actionSyncLocalChecklistItem } =
      await import("@/lib/sqlite/model/checklist-item");
    const item = await actionCreateLocalChecklistItem({
      tripId: "trip-a",
      userId: "user-a",
      title: "Pack passport",
    });

    await actionSyncLocalChecklistItem(item);

    expect(remote.upsert).toHaveBeenCalledWith({
      id: item.id,
      tripId: "trip-a",
      title: "Pack passport",
      completed: false,
    });
    expect(remote.update).not.toHaveBeenCalled();
    await expect(getSyncState(item.id)).resolves.toMatchObject({
      sync_status: "synced",
      sync_error: null,
      last_synced_at: expect.any(String),
    });
  });

  it("updates a previously synced item without using the creator-changing upsert", async () => {
    remote.update.mockResolvedValue(undefined);
    const {
      actionCreateLocalChecklistItem,
      actionListPendingLocalChecklistItems,
      actionMarkLocalChecklistItemSynced,
      actionSyncLocalChecklistItem,
      actionToggleLocalChecklistItemCompleted,
    } = await import("@/lib/sqlite/model/checklist-item");
    const item = await actionCreateLocalChecklistItem({
      tripId: "trip-a",
      userId: "user-a",
      title: "Book train",
    });
    await actionMarkLocalChecklistItemSynced(item.id, "user-a");
    await actionToggleLocalChecklistItemCompleted(item.id);
    const [pendingItem] = await actionListPendingLocalChecklistItems("user-a");

    await actionSyncLocalChecklistItem(pendingItem);

    expect(remote.update).toHaveBeenCalledWith({
      id: item.id,
      tripId: "trip-a",
      title: "Book train",
      completed: true,
    });
    expect(remote.upsert).not.toHaveBeenCalled();
  });

  it("hard-deletes an unsynced local tombstone without a remote call", async () => {
    const {
      actionCreateLocalChecklistItem,
      actionListPendingLocalChecklistItems,
      actionSoftDeleteLocalChecklistItem,
      actionSyncLocalChecklistItem,
    } = await import("@/lib/sqlite/model/checklist-item");
    const item = await actionCreateLocalChecklistItem({
      tripId: "trip-a",
      userId: "user-a",
      title: "Discard me",
    });
    await actionSoftDeleteLocalChecklistItem(item.id, "user-a");
    const [pendingItem] = await actionListPendingLocalChecklistItems("user-a");

    await actionSyncLocalChecklistItem(pendingItem);

    expect(remote.softDelete).not.toHaveBeenCalled();
    await expect(
      testDb.getFirstAsync<{ id: string }>(
        "select id from checklist_item where id = ?",
        [item.id],
      ),
    ).resolves.toBeNull();
  });

  it("soft-deletes a synced item remotely before removing its local tombstone", async () => {
    remote.softDelete.mockResolvedValue(undefined);
    const {
      actionCreateLocalChecklistItem,
      actionListPendingLocalChecklistItems,
      actionMarkLocalChecklistItemSynced,
      actionSoftDeleteLocalChecklistItem,
      actionSyncLocalChecklistItem,
    } = await import("@/lib/sqlite/model/checklist-item");
    const item = await actionCreateLocalChecklistItem({
      tripId: "trip-a",
      userId: "user-a",
      title: "Remove remotely",
    });
    await actionMarkLocalChecklistItemSynced(item.id, "user-a");
    await actionSoftDeleteLocalChecklistItem(item.id, "user-a");
    const [pendingItem] = await actionListPendingLocalChecklistItems("user-a");

    await actionSyncLocalChecklistItem(pendingItem);

    expect(remote.softDelete).toHaveBeenCalledWith(item.id);
    await expect(
      testDb.getFirstAsync<{ id: string }>(
        "select id from checklist_item where id = ?",
        [item.id],
      ),
    ).resolves.toBeNull();
  });

  it("records a remote failure and reports batch progress", async () => {
    remote.upsert
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("Offline"));
    const {
      actionCreateLocalChecklistItem,
      actionSyncLocalChecklistItem,
      actionSyncPendingLocalChecklistItems,
    } = await import("@/lib/sqlite/model/checklist-item");
    const successfulItem = await actionCreateLocalChecklistItem({
      tripId: "trip-a",
      userId: "user-a",
      title: "First",
    });
    const failedItem = await actionCreateLocalChecklistItem({
      tripId: "trip-a",
      userId: "user-a",
      title: "Second",
    });

    await actionSyncLocalChecklistItem(successfulItem);
    await expect(actionSyncLocalChecklistItem(failedItem)).rejects.toThrow("Offline");
    await expect(getSyncState(failedItem.id)).resolves.toEqual({
      sync_status: "failed",
      last_synced_at: null,
      sync_error: "Offline",
    });

    remote.upsert.mockResolvedValue(undefined);
    const result = await actionSyncPendingLocalChecklistItems("user-a", 1);
    expect(result).toEqual({ processed: 1, hasMore: true });
  });
});
