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
  actionSoftDeleteRemoteTrip: vi.fn(),
  actionUpsertRemoteTripFromLocal: vi.fn(),
}));

describe("local trips", () => {
  beforeEach(async () => {
    testDb = createTestSqliteDatabase();
    const { initializeDatabase } = await import("@/lib/sqlite/init");
    await initializeDatabase();
  });

  afterEach(() => {
    testDb.close();
  });

  it("lists owned and active-companion trips in local sort order", async () => {
    const { actionCreateLocalTrip, actionListLocalTrips } = await import(
      "@/lib/sqlite/model/trip"
    );
    const ownedLater = await actionCreateLocalTrip({
      userId: "user-a",
      title: "  Edinburgh  ",
      startDate: "2026-05-01",
      endDate: "2026-05-04",
    });
    const ownedEarlier = await actionCreateLocalTrip({
      userId: "user-a",
      title: "Lisbon",
      startDate: "2026-04-01",
      endDate: "2026-04-04",
    });
    const companionTrip = await actionCreateLocalTrip({
      userId: "user-b",
      title: "Berlin",
      startDate: "2026-05-01",
      endDate: "2026-05-05",
    });
    const inactiveTrip = await actionCreateLocalTrip({
      userId: "user-b",
      title: "Hidden",
      startDate: "2026-06-01",
      endDate: "2026-06-04",
    });
    const deletedTrip = await actionCreateLocalTrip({
      userId: "user-a",
      title: "Deleted",
      startDate: "2026-03-01",
      endDate: "2026-03-04",
    });

    await testDb.runAsync("update trip set created_at = ? where id = ?", [
      "2026-01-01T00:00:00.000Z",
      ownedLater.id,
    ]);
    await testDb.runAsync("update trip set created_at = ? where id = ?", [
      "2026-01-02T00:00:00.000Z",
      companionTrip.id,
    ]);
    await testDb.runAsync(
      `insert into trip_membership
        (trip_id, user_id, role, status, source, created_at, updated_at, last_synced_at)
       values (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        companionTrip.id,
        "user-a",
        "companion",
        "active",
        "remote",
        "2026-01-01T00:00:00.000Z",
        "2026-01-01T00:00:00.000Z",
        null,
      ],
    );
    await testDb.runAsync(
      `insert into trip_membership
        (trip_id, user_id, role, status, source, created_at, updated_at, last_synced_at)
       values (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        inactiveTrip.id,
        "user-a",
        "companion",
        "pending",
        "remote",
        "2026-01-01T00:00:00.000Z",
        "2026-01-01T00:00:00.000Z",
        null,
      ],
    );
    await testDb.runAsync("update trip set deleted_at = ? where id = ?", [
      "2026-01-03T00:00:00.000Z",
      deletedTrip.id,
    ]);

    expect(ownedLater.title).toBe("Edinburgh");
    await expect(actionListLocalTrips("user-a")).resolves.toEqual([
      expect.objectContaining({ id: ownedEarlier.id, title: "Lisbon" }),
      expect.objectContaining({ id: companionTrip.id, title: "Berlin" }),
      expect.objectContaining({ id: ownedLater.id, title: "Edinburgh" }),
    ]);
  });

  it("retrieves trips for owners and active companions only", async () => {
    const {
      actionCreateLocalTrip,
      actionGetLocalTrip,
      actionSoftDeleteLocalTrip,
      actionUpsertLocalTripMembershipFromRemote,
    } = await import("@/lib/sqlite/model/trip");
    const ownedTrip = await actionCreateLocalTrip({
      userId: "user-a",
      title: "Owned",
      startDate: "2026-04-01",
      endDate: "2026-04-04",
    });
    const companionTrip = await actionCreateLocalTrip({
      userId: "user-b",
      title: "Companion",
      startDate: "2026-04-01",
      endDate: "2026-04-04",
    });
    const inactiveTrip = await actionCreateLocalTrip({
      userId: "user-b",
      title: "Inactive",
      startDate: "2026-04-01",
      endDate: "2026-04-04",
    });

    await actionUpsertLocalTripMembershipFromRemote({
      tripId: companionTrip.id,
      userId: "user-a",
      role: "companion",
      status: "active",
      source: "remote",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
    await actionUpsertLocalTripMembershipFromRemote({
      tripId: inactiveTrip.id,
      userId: "user-a",
      role: "companion",
      status: "pending",
      source: "remote",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });

    await expect(actionGetLocalTrip(ownedTrip.id, "user-a")).resolves.toMatchObject({
      id: ownedTrip.id,
    });
    await expect(
      actionGetLocalTrip(companionTrip.id, "user-a"),
    ).resolves.toMatchObject({ id: companionTrip.id });
    await expect(actionGetLocalTrip(inactiveTrip.id, "user-a")).resolves.toBeNull();
    await expect(actionGetLocalTrip(ownedTrip.id, "user-c")).resolves.toBeNull();

    await actionSoftDeleteLocalTrip(ownedTrip.id, "user-a");
    await expect(actionGetLocalTrip(ownedTrip.id, "user-a")).resolves.toBeNull();
  });

  it("updates and deletes only the owner's trip", async () => {
    const {
      actionCreateLocalTrip,
      actionGetLocalTrip,
      actionHardDeleteLocalTrip,
      actionSoftDeleteLocalTrip,
      actionUpdateLocalTrip,
    } = await import("@/lib/sqlite/model/trip");
    const trip = await actionCreateLocalTrip({
      userId: "user-a",
      title: "Original title",
      startDate: "2026-04-01",
      endDate: "2026-04-04",
    });

    await expect(
      actionUpdateLocalTrip({
        id: trip.id,
        userId: "user-a",
        title: "  Updated title  ",
        startDate: "2026-04-02",
        endDate: "2026-04-05",
      }),
    ).resolves.toMatchObject({
      title: "Updated title",
      startDate: "2026-04-02",
      endDate: "2026-04-05",
      syncStatus: "pending",
      syncError: null,
    });

    await expect(
      actionUpdateLocalTrip({
        id: trip.id,
        userId: "user-b",
        title: "Not allowed",
        startDate: "2026-05-01",
        endDate: "2026-05-04",
      }),
    ).rejects.toThrow("Trip not found");
    await expect(actionGetLocalTrip(trip.id, "user-a")).resolves.toMatchObject({
      title: "Updated title",
    });

    await actionSoftDeleteLocalTrip(trip.id, "user-b");
    await expect(actionGetLocalTrip(trip.id, "user-a")).resolves.not.toBeNull();

    await actionSoftDeleteLocalTrip(trip.id, "user-a");
    await expect(actionGetLocalTrip(trip.id, "user-a")).resolves.toBeNull();

    await actionHardDeleteLocalTrip(trip.id, "user-b");
    await expect(
      testDb.getFirstAsync<{ id: string }>("select id from trip where id = ?", [
        trip.id,
      ]),
    ).resolves.not.toBeNull();

    await actionHardDeleteLocalTrip(trip.id, "user-a");
    await expect(
      testDb.getFirstAsync<{ id: string }>("select id from trip where id = ?", [
        trip.id,
      ]),
    ).resolves.toBeNull();
  });

  it("selects the oldest unsynced trips owned by the user and persists sync states", async () => {
    const {
      actionCreateLocalTrip,
      actionListPendingLocalTrips,
      actionMarkLocalTripSyncFailed,
      actionMarkLocalTripSynced,
      actionMarkLocalTripSyncing,
    } = await import("@/lib/sqlite/model/trip");
    const oldest = await actionCreateLocalTrip({
      userId: "user-a",
      title: "Oldest",
      startDate: "2026-04-01",
      endDate: "2026-04-04",
    });
    const middle = await actionCreateLocalTrip({
      userId: "user-a",
      title: "Middle",
      startDate: "2026-05-01",
      endDate: "2026-05-04",
    });
    const synced = await actionCreateLocalTrip({
      userId: "user-a",
      title: "Synced",
      startDate: "2026-06-01",
      endDate: "2026-06-04",
    });
    const otherUser = await actionCreateLocalTrip({
      userId: "user-b",
      title: "Other user",
      startDate: "2026-07-01",
      endDate: "2026-07-04",
    });

    for (const [id, createdAt] of [
      [oldest.id, "2026-01-01T00:00:00.000Z"],
      [middle.id, "2026-01-02T00:00:00.000Z"],
      [synced.id, "2026-01-03T00:00:00.000Z"],
      [otherUser.id, "2026-01-04T00:00:00.000Z"],
    ]) {
      await testDb.runAsync("update trip set created_at = ? where id = ?", [
        createdAt,
        id,
      ]);
    }
    await actionMarkLocalTripSynced(synced.id, "user-a");

    await expect(actionListPendingLocalTrips("user-a", 1)).resolves.toEqual([
      expect.objectContaining({ id: oldest.id }),
    ]);
    await expect(actionListPendingLocalTrips("user-a")).resolves.toEqual([
      expect.objectContaining({ id: oldest.id }),
      expect.objectContaining({ id: middle.id }),
    ]);

    await actionMarkLocalTripSyncFailed(oldest.id, "user-a", "Network error");
    await actionMarkLocalTripSyncing(oldest.id, "user-a");
    await expect(
      testDb.getFirstAsync<{
        sync_status: string;
        sync_error: string | null;
      }>("select sync_status, sync_error from trip where id = ?", [oldest.id]),
    ).resolves.toEqual({ sync_status: "syncing", sync_error: null });

    await actionMarkLocalTripSynced(oldest.id, "user-a");
    await expect(
      testDb.getFirstAsync<{
        sync_status: string;
        last_synced_at: string | null;
        sync_error: string | null;
      }>(
        "select sync_status, last_synced_at, sync_error from trip where id = ?",
        [oldest.id],
      ),
    ).resolves.toMatchObject({
      sync_status: "synced",
      sync_error: null,
      last_synced_at: expect.any(String),
    });
  });
});
