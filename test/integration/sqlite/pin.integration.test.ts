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
  actionSoftDeleteRemotePin: vi.fn(),
  actionUpsertRemotePinFromLocal: vi.fn(),
}));

describe("local pins", () => {
  beforeEach(async () => {
    testDb = createTestSqliteDatabase();
    const { initializeDatabase } = await import("@/lib/sqlite/init");
    await initializeDatabase();
  });

  afterEach(() => {
    testDb.close();
  });

  it("normalizes pins and hydrates optional location and creator details", async () => {
    const { actionCreateLocalPin, actionListLocalPins } = await import(
      "@/lib/sqlite/model/pin"
    );
    const { actionUpsertLocalPinLocation } = await import(
      "@/lib/sqlite/model/pin-location"
    );
    const placePin = await actionCreateLocalPin({
      tripId: "trip-a",
      userId: "user-a",
      name: "  Museum  ",
      startDate: "2026-05-01",
      endDate: "2026-05-03",
      time: " 10:00 ",
      endTime: " 12:00 ",
      categoryId: "place",
      metadataJson: { version: 1, destination: "Ignored for mapping" },
    });
    const stayPin = await actionCreateLocalPin({
      tripId: "trip-a",
      userId: "user-b",
      name: null,
      startDate: "2026-05-02",
      endDate: "2026-05-04",
      time: null,
      endTime: "09:00",
      categoryId: "stay",
      metadataJson: { version: 1 },
    });

    await testDb.runAsync(
      "insert into user_profile (id, username, updated_at) values (?, ?, ?)",
      ["user-a", "alice", "2026-01-01T00:00:00.000Z"],
    );
    await actionUpsertLocalPinLocation({
      pinId: placePin.id,
      userId: "user-a",
      placeId: "place-a",
      displayName: "  National Museum  ",
      formattedAddress: " 1 Main Street ",
      latitude: 51.5,
      longitude: -0.1,
    });

    expect(placePin).toMatchObject({
      name: "Museum",
      endDate: null,
      time: "10:00",
      endTime: null,
      syncStatus: "pending",
      location: null,
    });
    expect(stayPin).toMatchObject({ endDate: "2026-05-04", endTime: "09:00" });
    await expect(actionListLocalPins("trip-a", "user-a")).resolves.toEqual([
      expect.objectContaining({
        id: placePin.id,
        creator: { userId: "user-a", username: "alice", isCurrentUser: true },
        location: {
          placeId: "place-a",
          displayName: "National Museum",
          formattedAddress: "1 Main Street",
          latitude: 51.5,
          longitude: -0.1,
        },
      }),
      expect.objectContaining({ id: stayPin.id, location: null }),
    ]);
  });

  it("only changes or deletes a pin for its creator and removes its location on deletion", async () => {
    const {
      actionCreateLocalPin,
      actionGetLocalPin,
      actionHardDeleteLocalPin,
      actionSoftDeleteLocalPin,
      actionUpdateLocalPin,
    } = await import("@/lib/sqlite/model/pin");
    const { actionGetLocalPinLocation, actionUpsertLocalPinLocation } = await import(
      "@/lib/sqlite/model/pin-location"
    );
    const pin = await actionCreateLocalPin({
      tripId: "trip-a",
      userId: "user-a",
      name: "Original",
      startDate: "2026-05-01",
      endDate: null,
      time: null,
      endTime: null,
      categoryId: "place",
      metadataJson: { version: 1 },
    });
    await actionUpsertLocalPinLocation({
      pinId: pin.id,
      userId: "user-a",
      placeId: "place-a",
      displayName: "Museum",
      formattedAddress: "1 Main Street",
      latitude: 51.5,
      longitude: -0.1,
    });

    await actionUpdateLocalPin({
      id: pin.id,
      userId: "user-b",
      name: "Not allowed",
      startDate: "2026-06-01",
      endDate: null,
      time: null,
      endTime: null,
      categoryId: "place",
      metadataJson: { version: 1 },
    });
    await expect(actionGetLocalPin(pin.id, "user-a")).resolves.toMatchObject({
      name: "Original",
      startDate: "2026-05-01",
    });

    await expect(
      actionUpdateLocalPin({
        id: pin.id,
        userId: "user-a",
        name: "  Updated  ",
        startDate: "2026-06-01",
        endDate: "2026-06-02",
        time: " 09:00 ",
        endTime: " 10:00 ",
        categoryId: "event",
        metadataJson: { version: 1, departure: "Hotel" },
      }),
    ).resolves.toMatchObject({
      name: "Updated",
      startDate: "2026-06-01",
      endDate: "2026-06-02",
      time: "09:00",
      endTime: "10:00",
      syncStatus: "pending",
    });

    await actionSoftDeleteLocalPin(pin.id, "user-b");
    await expect(actionGetLocalPin(pin.id, "user-a")).resolves.not.toBeNull();

    await actionSoftDeleteLocalPin(pin.id, "user-a");
    await expect(actionGetLocalPin(pin.id, "user-a")).resolves.toBeNull();
    await expect(actionGetLocalPinLocation(pin.id, "user-a")).resolves.toBeNull();

    await actionHardDeleteLocalPin(pin.id, "user-b");
    await expect(
      testDb.getFirstAsync<{ id: string }>("select id from pin where id = ?", [
        pin.id,
      ]),
    ).resolves.not.toBeNull();

    await actionHardDeleteLocalPin(pin.id, "user-a");
    await expect(
      testDb.getFirstAsync<{ id: string }>("select id from pin where id = ?", [
        pin.id,
      ]),
    ).resolves.toBeNull();
  });

  it("selects the oldest unsynced pins owned by the user and persists sync states", async () => {
    const {
      actionCreateLocalPin,
      actionListPendingLocalPins,
      actionMarkLocalPinSyncFailed,
      actionMarkLocalPinSynced,
      actionMarkLocalPinSyncing,
    } = await import("@/lib/sqlite/model/pin");
    const createPin = (userId: string, name: string) =>
      actionCreateLocalPin({
        tripId: "trip-a",
        userId,
        name,
        startDate: "2026-05-01",
        endDate: null,
        time: null,
        endTime: null,
        categoryId: "place",
        metadataJson: { version: 1 },
      });
    const oldest = await createPin("user-a", "Oldest");
    const middle = await createPin("user-a", "Middle");
    const synced = await createPin("user-a", "Synced");
    const otherUser = await createPin("user-b", "Other user");

    for (const [id, createdAt] of [
      [oldest.id, "2026-01-01T00:00:00.000Z"],
      [middle.id, "2026-01-02T00:00:00.000Z"],
      [synced.id, "2026-01-03T00:00:00.000Z"],
      [otherUser.id, "2026-01-04T00:00:00.000Z"],
    ]) {
      await testDb.runAsync("update pin set created_at = ? where id = ?", [
        createdAt,
        id,
      ]);
    }
    await actionMarkLocalPinSynced(synced.id, "user-a");

    await expect(actionListPendingLocalPins("user-a", 1)).resolves.toEqual([
      expect.objectContaining({ id: oldest.id }),
    ]);
    await expect(actionListPendingLocalPins("user-a")).resolves.toEqual([
      expect.objectContaining({ id: oldest.id }),
      expect.objectContaining({ id: middle.id }),
    ]);

    await actionMarkLocalPinSyncFailed(oldest.id, "user-a", "Network error");
    await actionMarkLocalPinSyncing(oldest.id, "user-a");
    await expect(
      testDb.getFirstAsync<{
        sync_status: string;
        sync_error: string | null;
      }>("select sync_status, sync_error from pin where id = ?", [oldest.id]),
    ).resolves.toEqual({ sync_status: "syncing", sync_error: null });

    await actionMarkLocalPinSynced(oldest.id, "user-a");
    await expect(
      testDb.getFirstAsync<{
        sync_status: string;
        last_synced_at: string | null;
        sync_error: string | null;
      }>(
        "select sync_status, last_synced_at, sync_error from pin where id = ?",
        [oldest.id],
      ),
    ).resolves.toMatchObject({
      sync_status: "synced",
      sync_error: null,
      last_synced_at: expect.any(String),
    });
  });

  it("lists active pins that cover a date with timed pins before all-day pins", async () => {
    const { actionCreateLocalPin, actionListLocalPinsByTripAndDate } =
      await import("@/lib/sqlite/model/pin");
    const rangePin = await actionCreateLocalPin({
      tripId: "trip-a",
      userId: "user-a",
      name: "Three-day event",
      startDate: "2026-05-01",
      endDate: "2026-05-03",
      time: "09:00",
      endTime: "10:00",
      categoryId: "event",
      metadataJson: { version: 1 },
    });
    const timedPin = await actionCreateLocalPin({
      tripId: "trip-a",
      userId: "user-a",
      name: "Lunch",
      startDate: "2026-05-02",
      endDate: null,
      time: "12:00",
      endTime: null,
      categoryId: "place",
      metadataJson: { version: 1 },
    });
    const allDayPin = await actionCreateLocalPin({
      tripId: "trip-a",
      userId: "user-a",
      name: "All day",
      startDate: "2026-05-02",
      endDate: null,
      time: null,
      endTime: null,
      categoryId: "place",
      metadataJson: { version: 1 },
    });
    const deletedPin = await actionCreateLocalPin({
      tripId: "trip-a",
      userId: "user-a",
      name: "Deleted",
      startDate: "2026-05-02",
      endDate: null,
      time: "08:00",
      endTime: null,
      categoryId: "place",
      metadataJson: { version: 1 },
    });
    await testDb.runAsync("update pin set deleted_at = ? where id = ?", [
      "2026-05-02T00:00:00.000Z",
      deletedPin.id,
    ]);

    await expect(
      actionListLocalPinsByTripAndDate("trip-a", "user-a", "2026-05-02"),
    ).resolves.toEqual([
      expect.objectContaining({ id: rangePin.id }),
      expect.objectContaining({ id: timedPin.id }),
      expect.objectContaining({ id: allDayPin.id }),
    ]);
  });

  it("soft-deletes the creator's pin children and removes its location", async () => {
    const { actionCreateLocalPin, actionSoftDeleteLocalPin } = await import(
      "@/lib/sqlite/model/pin"
    );
    const { actionGetLocalPinLocation, actionUpsertLocalPinLocation } =
      await import("@/lib/sqlite/model/pin-location");
    const pin = await actionCreateLocalPin({
      tripId: "trip-a",
      userId: "user-a",
      name: "Parent pin",
      startDate: "2026-05-01",
      endDate: null,
      time: null,
      endTime: null,
      categoryId: "place",
      metadataJson: { version: 1 },
    });
    const now = "2026-01-01T00:00:00.000Z";

    await actionUpsertLocalPinLocation({
      pinId: pin.id,
      userId: "user-a",
      placeId: "place-a",
      displayName: "Museum",
      formattedAddress: "1 Main Street",
      latitude: 51.5,
      longitude: -0.1,
    });
    await testDb.runAsync(
      `insert into note (id, trip_id, pin_id, user_id, text, created_at, updated_at, sync_status, last_synced_at, sync_error, deleted_at)
       values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ["note-a", "trip-a", pin.id, "user-a", "Note", now, now, "synced", now, null, null],
    );
    await testDb.runAsync(
      `insert into reference_link (id, trip_id, pin_id, user_id, title, url, caption, created_at, updated_at, sync_status, last_synced_at, sync_error, deleted_at)
       values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ["link-a", "trip-a", pin.id, "user-a", null, "https://example.com", null, now, now, "synced", now, null, null],
    );
    await testDb.runAsync(
      `insert into expense (id, pin_id, trip_id, user_id, description, amount, currency, paid_by_user_id, paid_by_name, created_at, updated_at, sync_status, last_synced_at, sync_error, deleted_at)
       values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ["expense-a", pin.id, "trip-a", "user-a", "Lunch", 10, "GBP", "user-a", "Alice", now, now, "synced", now, null, null],
    );
    await testDb.runAsync(
      `insert into document (id, trip_id, pin_id, user_id, file_name, mime_type, storage_bucket, storage_path, caption, created_at, updated_at, sync_status, last_synced_at, sync_error, deleted_at)
       values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ["document-a", "trip-a", pin.id, "user-a", "ticket.pdf", "application/pdf", "documents", "ticket.pdf", null, now, now, "synced", now, null, null],
    );
    await testDb.runAsync(
      `insert into image (id, pin_id, trip_id, user_id, local_uri, storage_bucket, storage_path, mime_type, width, height, caption, created_at, updated_at, sync_status, last_synced_at, sync_error, deleted_at)
       values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ["image-a", pin.id, "trip-a", "user-a", "file:///image.jpg", "images", "image.jpg", "image/jpeg", 100, 100, null, now, now, "synced", now, null, null],
    );
    await testDb.runAsync(
      `insert into note (id, trip_id, pin_id, user_id, text, created_at, updated_at, sync_status, last_synced_at, sync_error, deleted_at)
       values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ["note-b", "trip-a", pin.id, "user-b", "Other user's note", now, now, "synced", now, null, null],
    );

    await actionSoftDeleteLocalPin(pin.id, "user-a");

    for (const [tableName, id] of [
      ["pin", pin.id],
      ["note", "note-a"],
      ["reference_link", "link-a"],
      ["expense", "expense-a"],
      ["document", "document-a"],
      ["image", "image-a"],
    ]) {
      await expect(
        testDb.getFirstAsync<{ deleted_at: string | null }>(
          `select deleted_at from ${tableName} where id = ?`,
          [id],
        ),
      ).resolves.toMatchObject({ deleted_at: expect.any(String) });
    }
    await expect(actionGetLocalPinLocation(pin.id, "user-a")).resolves.toBeNull();
    await expect(
      testDb.getFirstAsync<{ deleted_at: string | null }>(
        "select deleted_at from note where id = ?",
        ["note-b"],
      ),
    ).resolves.toEqual({ deleted_at: null });
  });
});
