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
  actionSoftDeleteRemoteTrip: remote.softDelete,
  actionUpsertRemoteTripFromLocal: remote.upsert,
}));

const tripInput = {
  userId: "user-a",
  title: "Lisbon",
  startDate: "2026-05-01",
  endDate: "2026-05-04",
};

describe("trip sync", () => {
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

  it("uploads a locally created trip and marks it synced", async () => {
    remote.upsert.mockResolvedValue(undefined);
    const { actionCreateLocalTrip, actionSyncLocalTrip } = await import(
      "@/lib/sqlite/model/trip"
    );
    const trip = await actionCreateLocalTrip(tripInput);

    expect(trip.syncStatus).toBe("pending");
    await actionSyncLocalTrip(trip);

    expect(remote.upsert).toHaveBeenCalledWith({
      id: trip.id,
      title: "Lisbon",
      startDate: "2026-05-01",
      endDate: "2026-05-04",
    });
    await expect(
      testDb.getFirstAsync<{
        sync_status: string;
        last_synced_at: string | null;
      }>("select sync_status, last_synced_at from trip where id = ?", [trip.id]),
    ).resolves.toMatchObject({
      sync_status: "synced",
      last_synced_at: expect.any(String),
    });
  });

  it("uses the correct local and remote paths for trip tombstones", async () => {
    remote.softDelete.mockResolvedValue(undefined);
    const {
      actionCreateLocalTrip,
      actionListPendingLocalTrips,
      actionMarkLocalTripSynced,
      actionSoftDeleteLocalTrip,
      actionSyncLocalTrip,
    } = await import("@/lib/sqlite/model/trip");
    const unsyncedTrip = await actionCreateLocalTrip(tripInput);
    await actionSoftDeleteLocalTrip(unsyncedTrip.id, "user-a");
    const [unsyncedTombstone] = await actionListPendingLocalTrips("user-a");
    await actionSyncLocalTrip(unsyncedTombstone);
    expect(remote.softDelete).not.toHaveBeenCalled();

    const syncedTrip = await actionCreateLocalTrip({
      ...tripInput,
      title: "Synced trip",
    });
    await actionMarkLocalTripSynced(syncedTrip.id, "user-a");
    await actionSoftDeleteLocalTrip(syncedTrip.id, "user-a");
    const [syncedTombstone] = await actionListPendingLocalTrips("user-a");
    await actionSyncLocalTrip(syncedTombstone);

    expect(remote.softDelete).toHaveBeenCalledWith(syncedTrip.id);
    await expect(
      testDb.getFirstAsync<{ id: string }>("select id from trip where id = ?", [
        syncedTrip.id,
      ]),
    ).resolves.toBeNull();
  });

  it("records remote failures and drains locally pending trips in batches", async () => {
    remote.upsert.mockRejectedValueOnce(new Error("Offline"));
    const {
      actionCreateLocalTrip,
      actionSyncLocalTrip,
      actionSyncPendingLocalTrips,
    } = await import("@/lib/sqlite/model/trip");
    const failedTrip = await actionCreateLocalTrip(tripInput);

    await expect(actionSyncLocalTrip(failedTrip)).rejects.toThrow("Offline");
    await expect(
      testDb.getFirstAsync<{
        sync_status: string;
        sync_error: string | null;
      }>("select sync_status, sync_error from trip where id = ?", [failedTrip.id]),
    ).resolves.toEqual({ sync_status: "failed", sync_error: "Offline" });

    remote.upsert.mockResolvedValue(undefined);
    await expect(actionSyncPendingLocalTrips("user-a", 1)).resolves.toEqual({
      processed: 1,
      hasMore: true,
    });
  });
});
