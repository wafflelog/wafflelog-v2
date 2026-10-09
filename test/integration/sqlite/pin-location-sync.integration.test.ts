import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createTestSqliteDatabase,
  type TestSqliteDatabase,
} from "./test-db";

const remote = vi.hoisted(() => ({
  upsert: vi.fn(),
}));

let testDb: TestSqliteDatabase;

vi.mock("@/lib/sqlite/client", () => ({
  get sqlite() {
    return testDb;
  },
}));

vi.mock("@/lib/supabase/actions", () => ({
  actionUpsertRemotePinLocationFromLocal: remote.upsert,
}));

const localInput = {
  pinId: "pin-a",
  userId: "user-a",
  placeId: "place-a",
  displayName: "City Museum",
  formattedAddress: "1 Museum Road",
  imageUrl: "https://example.com/museum.jpg",
  localImageUri: "file:///museum.jpg",
  rating: 4.5,
  reviewCount: 120,
  latitude: 51.5,
  longitude: -0.12,
};

describe("pin location sync", () => {
  beforeEach(async () => {
    testDb = createTestSqliteDatabase();
    remote.upsert.mockReset();

    const { initializeDatabase } = await import("@/lib/sqlite/init");
    await initializeDatabase();
  });

  afterEach(() => {
    testDb.close();
  });

  it("uploads durable location fields and marks the local row synced", async () => {
    remote.upsert.mockResolvedValue(undefined);
    const { actionSyncLocalPinLocation, actionUpsertLocalPinLocation } =
      await import("@/lib/sqlite/model/pin-location");
    const location = await actionUpsertLocalPinLocation(localInput);

    expect(location.syncStatus).toBe("pending");
    await actionSyncLocalPinLocation(location);

    expect(remote.upsert).toHaveBeenCalledWith({
      pinId: "pin-a",
      placeId: "place-a",
      displayName: "City Museum",
      formattedAddress: "1 Museum Road",
      latitude: 51.5,
      longitude: -0.12,
      createdAt: location.createdAt,
      updatedAt: location.updatedAt,
    });
    await expect(
      testDb.getFirstAsync<{
        sync_status: string;
        last_synced_at: string | null;
      }>(
        "select sync_status, last_synced_at from pin_location where pin_id = ?",
        ["pin-a"],
      ),
    ).resolves.toMatchObject({
      sync_status: "synced",
      last_synced_at: expect.any(String),
    });
  });

  it("records upload failures and retries pending locations in batches", async () => {
    remote.upsert.mockRejectedValueOnce(new Error("Offline"));
    const {
      actionSyncLocalPinLocation,
      actionSyncPendingLocalPinLocations,
      actionUpsertLocalPinLocation,
    } = await import("@/lib/sqlite/model/pin-location");
    const location = await actionUpsertLocalPinLocation(localInput);

    await expect(actionSyncLocalPinLocation(location)).rejects.toThrow("Offline");
    await expect(
      testDb.getFirstAsync<{
        sync_status: string;
        sync_error: string | null;
      }>("select sync_status, sync_error from pin_location where pin_id = ?", [
        "pin-a",
      ]),
    ).resolves.toEqual({ sync_status: "failed", sync_error: "Offline" });

    remote.upsert.mockResolvedValue(undefined);
    await expect(
      actionSyncPendingLocalPinLocations("user-a", 1),
    ).resolves.toEqual({ processed: 1, hasMore: true });
  });

  it("keeps device-only place metadata when remote fields are downloaded", async () => {
    const {
      actionGetLocalPinLocation,
      actionUpsertLocalPinLocation,
      actionUpsertLocalPinLocationFromRemote,
    } = await import("@/lib/sqlite/model/pin-location");
    const now = "2026-01-01T00:00:00.000Z";
    await testDb.runAsync(
      `
        insert into trip (
          id, user_id, title, start_date, end_date, created_at, updated_at,
          sync_status, last_synced_at, sync_error, deleted_at
        ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        "trip-a",
        "user-a",
        "Museum trip",
        "2026-05-01",
        "2026-05-04",
        now,
        now,
        "synced",
        now,
        null,
        null,
      ],
    );
    await testDb.runAsync(
      `
        insert into pin (
          id, trip_id, user_id, name, start_date, end_date, time, end_time,
          category_id, metadata_json, created_at, updated_at, sync_status,
          last_synced_at, sync_error, deleted_at
        ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        "pin-a",
        "trip-a",
        "user-a",
        "Museum",
        "2026-05-01",
        null,
        null,
        null,
        "other",
        '{"version":1}',
        now,
        now,
        "synced",
        now,
        null,
        null,
      ],
    );
    await testDb.runAsync(
      `
        insert into trip_membership (
          trip_id, user_id, role, status, source, created_at, updated_at,
          last_synced_at
        ) values (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        "trip-a",
        "companion-a",
        "companion",
        "active",
        "companion",
        now,
        now,
        now,
      ],
    );
    await actionUpsertLocalPinLocation(localInput);
    await testDb.runAsync(
      "update pin_location set sync_status = 'synced' where pin_id = ?",
      ["pin-a"],
    );

    await actionUpsertLocalPinLocationFromRemote({
      pinId: "pin-a",
      userId: "user-a",
      placeId: "remote-place",
      displayName: "Updated Museum",
      formattedAddress: "2 Museum Road",
      latitude: 51.51,
      longitude: -0.13,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-02T00:00:00.000Z",
    });

    await expect(
      actionGetLocalPinLocation("pin-a", "companion-a"),
    ).resolves.toMatchObject({
      userId: "user-a",
      placeId: "remote-place",
      displayName: "Updated Museum",
      imageUrl: "https://example.com/museum.jpg",
      localImageUri: "file:///museum.jpg",
      rating: 4.5,
      reviewCount: 120,
      syncStatus: "synced",
    });
  });
});
