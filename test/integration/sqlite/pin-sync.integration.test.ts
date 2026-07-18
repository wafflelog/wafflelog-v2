import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createTestSqliteDatabase,
  type TestSqliteDatabase,
} from "./test-db";

const remote = vi.hoisted(() => ({
  softDelete: vi.fn(),
  upsert: vi.fn(),
}));

let testDb: TestSqliteDatabase;

vi.mock("@/lib/sqlite/client", () => ({
  get sqlite() {
    return testDb;
  },
}));

vi.mock("@/lib/supabase/actions", () => ({
  actionSoftDeleteRemotePin: remote.softDelete,
  actionUpsertRemotePinFromLocal: remote.upsert,
}));

const pinInput = {
  tripId: "trip-a",
  userId: "user-a",
  name: "Museum",
  startDate: "2026-05-01",
  endDate: null,
  time: "10:00",
  endTime: null,
  categoryId: "place",
  metadataJson: { version: 1 as const },
};

describe("pin sync", () => {
  beforeEach(async () => {
    testDb = createTestSqliteDatabase();
    remote.softDelete.mockReset();
    remote.upsert.mockReset();

    const { initializeDatabase } = await import("@/lib/sqlite/init");
    await initializeDatabase();
  });

  afterEach(() => {
    testDb.close();
  });

  it("upserts a new or edited pin and marks it synced", async () => {
    remote.upsert.mockResolvedValue(undefined);
    const {
      actionCreateLocalPin,
      actionListPendingLocalPins,
      actionMarkLocalPinSynced,
      actionSyncLocalPin,
      actionUpdateLocalPin,
    } = await import("@/lib/sqlite/model/pin");
    const pin = await actionCreateLocalPin(pinInput);

    await actionSyncLocalPin(pin);
    expect(remote.upsert).toHaveBeenCalledWith({
      id: pin.id,
      tripId: "trip-a",
      name: "Museum",
      startDate: "2026-05-01",
      endDate: null,
      time: "10:00",
      endTime: null,
      categoryId: "place",
      metadataJson: { version: 1 },
    });

    await actionMarkLocalPinSynced(pin.id, "user-a");
    await actionUpdateLocalPin({
      ...pinInput,
      id: pin.id,
      name: "Updated museum",
      startDate: "2026-05-02",
    });
    const [editedPin] = await actionListPendingLocalPins("user-a");
    await actionSyncLocalPin(editedPin);

    expect(remote.upsert).toHaveBeenLastCalledWith(
      expect.objectContaining({
        id: pin.id,
        name: "Updated museum",
        startDate: "2026-05-02",
      }),
    );
    await expect(
      testDb.getFirstAsync<{ sync_status: string; last_synced_at: string | null }>(
        "select sync_status, last_synced_at from pin where id = ?",
        [pin.id],
      ),
    ).resolves.toMatchObject({
      sync_status: "synced",
      last_synced_at: expect.any(String),
    });
  });

  it("removes unsynced and synced tombstones through the correct local/remote path", async () => {
    remote.softDelete.mockResolvedValue(undefined);
    const {
      actionCreateLocalPin,
      actionListPendingLocalPins,
      actionMarkLocalPinSynced,
      actionSoftDeleteLocalPin,
      actionSyncLocalPin,
    } = await import("@/lib/sqlite/model/pin");
    const unsyncedPin = await actionCreateLocalPin(pinInput);
    await actionSoftDeleteLocalPin(unsyncedPin.id, "user-a");
    const [unsyncedTombstone] = await actionListPendingLocalPins("user-a");
    await actionSyncLocalPin(unsyncedTombstone);
    expect(remote.softDelete).not.toHaveBeenCalled();

    const syncedPin = await actionCreateLocalPin({ ...pinInput, name: "Synced" });
    await actionMarkLocalPinSynced(syncedPin.id, "user-a");
    await actionSoftDeleteLocalPin(syncedPin.id, "user-a");
    const [syncedTombstone] = await actionListPendingLocalPins("user-a");
    await actionSyncLocalPin(syncedTombstone);

    expect(remote.softDelete).toHaveBeenCalledWith(syncedPin.id);
    await expect(
      testDb.getFirstAsync<{ id: string }>("select id from pin where id = ?", [
        syncedPin.id,
      ]),
    ).resolves.toBeNull();
  });

  it("records remote failures and drains pending pins in batches", async () => {
    remote.upsert.mockRejectedValueOnce(new Error("Offline"));
    const {
      actionCreateLocalPin,
      actionSyncLocalPin,
      actionSyncPendingLocalPins,
    } = await import("@/lib/sqlite/model/pin");
    const failedPin = await actionCreateLocalPin(pinInput);

    await expect(actionSyncLocalPin(failedPin)).rejects.toThrow("Offline");
    await expect(
      testDb.getFirstAsync<{
        sync_status: string;
        sync_error: string | null;
      }>("select sync_status, sync_error from pin where id = ?", [failedPin.id]),
    ).resolves.toEqual({ sync_status: "failed", sync_error: "Offline" });

    remote.upsert.mockResolvedValue(undefined);
    const result = await actionSyncPendingLocalPins("user-a", 1);
    expect(result).toEqual({ processed: 1, hasMore: true });
  });
});
