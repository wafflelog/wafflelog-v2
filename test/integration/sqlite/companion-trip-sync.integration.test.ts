import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createTestSqliteDatabase,
  type TestSqliteDatabase,
} from "./test-db";

const remote = vi.hoisted(() => ({
  getBundle: vi.fn(),
  listMemberships: vi.fn(),
  listOwnedTripIds: vi.fn(),
}));

let testDb: TestSqliteDatabase;

vi.mock("@/lib/sqlite/client", () => ({
  get sqlite() {
    return testDb;
  },
}));

vi.mock("@/lib/supabase/actions", () => ({
  actionGetRemoteTripSyncBundle: remote.getBundle,
  actionListActiveCompanionMemberships: remote.listMemberships,
  actionListRemoteOwnedTripIds: remote.listOwnedTripIds,
}));

const timestamps = {
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-02T00:00:00.000Z",
};

function createBundle(title = "Companion trip") {
  return {
    trip: {
      id: "trip-a",
      userId: "owner-a",
      title,
      startDate: "2026-05-01",
      endDate: "2026-05-04",
      ...timestamps,
      deletedAt: null,
    },
    pins: [
      {
        id: "pin-a",
        tripId: "trip-a",
        userId: "owner-a",
        name: "Museum",
        startDate: "2026-05-02",
        endDate: null,
        time: "10:00",
        endTime: null,
        categoryId: "place",
        metadataJson: { version: 1 },
        ...timestamps,
        deletedAt: null as string | null,
      },
    ],
    pinLocations: [
      {
        pinId: "pin-a",
        userId: "owner-a",
        placeId: "place-a",
        displayName: "City Museum",
        formattedAddress: "1 Museum Road",
        latitude: 51.5,
        longitude: -0.12,
        ...timestamps,
      },
    ],
    checklistItems: [
      {
        id: "checklist-a",
        tripId: "trip-a",
        userId: "companion-a",
        title: "Bring tickets",
        completed: false,
        ...timestamps,
        deletedAt: null as string | null,
      },
    ],
    notes: [
      {
        id: "note-a",
        tripId: "trip-a",
        pinId: "pin-a",
        userId: "companion-a",
        text: "Remote note",
        ...timestamps,
        deletedAt: null as string | null,
      },
    ],
    referenceLinks: [
      {
        id: "reference-link-a",
        tripId: "trip-a",
        pinId: "pin-a",
        userId: "companion-a",
        title: "Remote guide",
        url: "https://example.com/guide",
        caption: null as string | null,
        ...timestamps,
        deletedAt: null as string | null,
      },
    ],
    expenses: [
      {
        id: "expense-a",
        pinId: "pin-a",
        tripId: "trip-a",
        userId: "companion-a",
        description: "Lunch",
        amount: 12.5,
        currency: "GBP",
        paidByUserId: "companion-a",
        paidByName: "Companion",
        ...timestamps,
        deletedAt: null,
      },
    ],
    expenseParticipants: [
      { expenseId: "expense-a", userId: "owner-a", splitAmount: 6.25 },
      {
        expenseId: "expense-a",
        userId: "companion-a",
        splitAmount: 6.25,
      },
    ],
    documents: [
      {
        id: "document-a",
        tripId: "trip-a",
        pinId: "pin-a",
        userId: "companion-a",
        fileName: "remote-ticket.pdf",
        mimeType: "application/pdf",
        storageBucket: "documents",
        storagePath: "trip-a/remote-ticket.pdf",
        caption: null as string | null,
        ...timestamps,
        deletedAt: null as string | null,
      },
    ],
    images: [
      {
        id: "image-a",
        pinId: "pin-a",
        tripId: "trip-a",
        userId: "companion-a",
        storageBucket: "images",
        storagePath: "trip-a/remote-image.jpg",
        mimeType: "image/jpeg",
        width: 1200,
        height: 800,
        caption: "Remote image",
        ...timestamps,
        deletedAt: null as string | null,
      },
    ],
    userProfiles: [
      { id: "owner-a", username: "owner", updatedAt: timestamps.updatedAt },
      {
        id: "companion-a",
        username: "companion",
        updatedAt: timestamps.updatedAt,
      },
    ],
  };
}

describe("companion trip pull sync", () => {
  beforeEach(async () => {
    testDb = createTestSqliteDatabase();
    remote.getBundle.mockReset();
    remote.listMemberships.mockReset();
    remote.listOwnedTripIds.mockReset();

    const { initializeDatabase } = await import("@/lib/sqlite/init");
    await initializeDatabase();
  });

  afterEach(() => {
    testDb.close();
  });

  it("hydrates an active companion trip bundle into local SQLite", async () => {
    remote.listMemberships.mockResolvedValue([
      {
        id: "membership-a",
        tripId: "trip-a",
        userId: "companion-a",
        role: "companion",
        status: "active",
        ...timestamps,
      },
    ]);
    remote.getBundle.mockResolvedValue(createBundle());
    const { actionPullActiveCompanionTrips } = await import(
      "@/lib/sqlite/model/companion-trip-sync"
    );

    await expect(actionPullActiveCompanionTrips()).resolves.toEqual({
      processed: 1,
      nextOffset: 1,
      hasMore: false,
    });
    expect(remote.getBundle).toHaveBeenCalledWith("trip-a");
    await expect(
      testDb.getFirstAsync<{
        title: string;
        sync_status: string;
      }>("select title, sync_status from trip where id = ?", ["trip-a"]),
    ).resolves.toEqual({ title: "Companion trip", sync_status: "synced" });
    await expect(
      testDb.getFirstAsync<{
        status: string;
        source: string;
      }>(
        "select status, source from trip_membership where trip_id = ? and user_id = ?",
        ["trip-a", "companion-a"],
      ),
    ).resolves.toEqual({ status: "active", source: "companion" });
    await expect(
      testDb.getAllAsync<{ id: string; username: string }>(
        "select id, username from user_profile order by id",
      ),
    ).resolves.toEqual([
      { id: "companion-a", username: "companion" },
      { id: "owner-a", username: "owner" },
    ]);
    await expect(
      testDb.getFirstAsync<{
        sync_status: string;
        user_id: string;
      }>("select sync_status, user_id from checklist_item where id = ?", [
        "checklist-a",
      ]),
    ).resolves.toEqual({ sync_status: "synced", user_id: "companion-a" });
    await expect(
      testDb.getFirstAsync<{
        display_name: string;
        sync_status: string;
      }>("select display_name, sync_status from pin_location where pin_id = ?", [
        "pin-a",
      ]),
    ).resolves.toEqual({
      display_name: "City Museum",
      sync_status: "synced",
    });
    await expect(
      testDb.getFirstAsync<{
        paid_by_user_id: string;
        sync_status: string;
      }>("select paid_by_user_id, sync_status from expense where id = ?", [
        "expense-a",
      ]),
    ).resolves.toEqual({ paid_by_user_id: "companion-a", sync_status: "synced" });
    await expect(
      testDb.getFirstAsync<{
        local_uri: string | null;
        storage_path: string;
      }>("select local_uri, storage_path from image where id = ?", ["image-a"]),
    ).resolves.toEqual({
      local_uri: null,
      storage_path: "trip-a/remote-image.jpg",
    });
    await expect(
      testDb.getAllAsync<{ user_id: string; split_amount: string }>(
        "select user_id, split_amount from expense_participant where expense_id = ? order by user_id",
        ["expense-a"],
      ),
    ).resolves.toEqual([
      { user_id: "companion-a", split_amount: "6.25" },
      { user_id: "owner-a", split_amount: "6.25" },
    ]);
  });

  it("uses paging and updates existing local rows instead of duplicating them", async () => {
    remote.listMemberships.mockResolvedValue([
      {
        id: "membership-a",
        tripId: "trip-a",
        userId: "companion-a",
        role: "companion",
        status: "active",
        ...timestamps,
      },
      {
        id: "membership-b",
        tripId: "trip-b",
        userId: "companion-a",
        role: "companion",
        status: "active",
        ...timestamps,
      },
    ]);
    remote.getBundle
      .mockResolvedValueOnce(createBundle("First title"))
      .mockResolvedValueOnce(createBundle("Updated title"));
    const { actionPullActiveCompanionTrips } = await import(
      "@/lib/sqlite/model/companion-trip-sync"
    );

    await expect(actionPullActiveCompanionTrips(1, 0)).resolves.toEqual({
      processed: 1,
      nextOffset: 1,
      hasMore: true,
    });
    await expect(actionPullActiveCompanionTrips(1, 0)).resolves.toEqual({
      processed: 1,
      nextOffset: 1,
      hasMore: true,
    });
    await expect(
      testDb.getAllAsync<{ id: string; title: string }>(
        "select id, title from trip order by id",
      ),
    ).resolves.toEqual([{ id: "trip-a", title: "Updated title" }]);
  });

  it("preserves a downloaded image URI when refreshing remote metadata", async () => {
    remote.listMemberships.mockResolvedValue([
      {
        id: "membership-a",
        tripId: "trip-a",
        userId: "companion-a",
        role: "companion",
        status: "active",
        ...timestamps,
      },
    ]);
    remote.getBundle.mockResolvedValue(createBundle());
    const { actionPullActiveCompanionTrips } = await import(
      "@/lib/sqlite/model/companion-trip-sync"
    );

    await actionPullActiveCompanionTrips();
    await testDb.runAsync(
      "update image set local_uri = ? where id = ?",
      ["file:///cached-image.jpg", "image-a"],
    );

    const refreshedBundle = createBundle();
    refreshedBundle.images[0].caption = "Updated remotely";
    remote.getBundle.mockResolvedValue(refreshedBundle);
    await actionPullActiveCompanionTrips();

    await expect(
      testDb.getFirstAsync<{
        local_uri: string | null;
        caption: string | null;
      }>("select local_uri, caption from image where id = ?", ["image-a"]),
    ).resolves.toEqual({
      local_uri: "file:///cached-image.jpg",
      caption: "Updated remotely",
    });
  });

  it("preserves unsynced local records when pulling a remote bundle", async () => {
    remote.listMemberships.mockResolvedValue([
      {
        id: "membership-a",
        tripId: "trip-a",
        userId: "companion-a",
        role: "companion",
        status: "active",
        ...timestamps,
      },
    ]);
    remote.getBundle.mockResolvedValue(createBundle());
    const { actionPullActiveCompanionTrips } = await import(
      "@/lib/sqlite/model/companion-trip-sync"
    );

    await actionPullActiveCompanionTrips();
    await testDb.execAsync(`
      update trip
      set title = 'Local trip', sync_status = 'pending'
      where id = 'trip-a';

      update pin
      set name = 'Local museum', sync_status = 'syncing'
      where id = 'pin-a';

      update pin_location
      set display_name = 'Local location', sync_status = 'failed'
      where pin_id = 'pin-a';

      update checklist_item
      set title = 'Local checklist item', sync_status = 'pending'
      where id = 'checklist-a';

      update note
      set text = 'Local note', sync_status = 'syncing'
      where id = 'note-a';

      update reference_link
      set title = 'Local guide', sync_status = 'failed'
      where id = 'reference-link-a';

      update expense
      set description = 'Local expense', sync_status = 'pending'
      where id = 'expense-a';

      delete from expense_participant where expense_id = 'expense-a';
      insert into expense_participant (
        expense_id,
        user_id,
        split_amount,
        created_at,
        updated_at
      ) values (
        'expense-a',
        'owner-a',
        12.5,
        '${timestamps.createdAt}',
        '${timestamps.updatedAt}'
      );

      update document
      set file_name = 'local-ticket.pdf', sync_status = 'syncing'
      where id = 'document-a';

      update image
      set caption = 'Local image', sync_status = 'failed'
      where id = 'image-a';
    `);

    const remoteBundle = createBundle("Remote replacement trip");
    remoteBundle.pins[0].name = "Remote replacement museum";
    remoteBundle.pinLocations[0].displayName = "Remote replacement location";
    remoteBundle.checklistItems[0].title = "Remote replacement checklist item";
    remoteBundle.notes[0].text = "Remote replacement note";
    remoteBundle.referenceLinks[0].title = "Remote replacement guide";
    remoteBundle.expenses[0].description = "Remote replacement expense";
    remoteBundle.documents[0].fileName = "remote-replacement-ticket.pdf";
    remoteBundle.images[0].caption = "Remote replacement image";
    remote.getBundle.mockResolvedValue(remoteBundle);

    await actionPullActiveCompanionTrips();

    await expect(
      testDb.getFirstAsync<{ title: string; sync_status: string }>(
        "select title, sync_status from trip where id = ?",
        ["trip-a"],
      ),
    ).resolves.toEqual({ title: "Local trip", sync_status: "pending" });
    await expect(
      testDb.getFirstAsync<{ name: string; sync_status: string }>(
        "select name, sync_status from pin where id = ?",
        ["pin-a"],
      ),
    ).resolves.toEqual({ name: "Local museum", sync_status: "syncing" });
    await expect(
      testDb.getFirstAsync<{ display_name: string; sync_status: string }>(
        "select display_name, sync_status from pin_location where pin_id = ?",
        ["pin-a"],
      ),
    ).resolves.toEqual({
      display_name: "Local location",
      sync_status: "failed",
    });
    await expect(
      testDb.getFirstAsync<{ title: string; sync_status: string }>(
        "select title, sync_status from checklist_item where id = ?",
        ["checklist-a"],
      ),
    ).resolves.toEqual({
      title: "Local checklist item",
      sync_status: "pending",
    });
    await expect(
      testDb.getFirstAsync<{ text: string; sync_status: string }>(
        "select text, sync_status from note where id = ?",
        ["note-a"],
      ),
    ).resolves.toEqual({ text: "Local note", sync_status: "syncing" });
    await expect(
      testDb.getFirstAsync<{ title: string; sync_status: string }>(
        "select title, sync_status from reference_link where id = ?",
        ["reference-link-a"],
      ),
    ).resolves.toEqual({ title: "Local guide", sync_status: "failed" });
    await expect(
      testDb.getFirstAsync<{ description: string; sync_status: string }>(
        "select description, sync_status from expense where id = ?",
        ["expense-a"],
      ),
    ).resolves.toEqual({
      description: "Local expense",
      sync_status: "pending",
    });
    await expect(
      testDb.getAllAsync<{ user_id: string; split_amount: string }>(
        "select user_id, split_amount from expense_participant where expense_id = ?",
        ["expense-a"],
      ),
    ).resolves.toEqual([{ user_id: "owner-a", split_amount: "12.5" }]);
    await expect(
      testDb.getFirstAsync<{ file_name: string; sync_status: string }>(
        "select file_name, sync_status from document where id = ?",
        ["document-a"],
      ),
    ).resolves.toEqual({
      file_name: "local-ticket.pdf",
      sync_status: "syncing",
    });
    await expect(
      testDb.getFirstAsync<{ caption: string; sync_status: string }>(
        "select caption, sync_status from image where id = ?",
        ["image-a"],
      ),
    ).resolves.toEqual({ caption: "Local image", sync_status: "failed" });
  });

  it("discovers and hydrates owned trips when local SQLite is empty", async () => {
    const bundle = createBundle("Fresh remote title");
    bundle.checklistItems[0].deletedAt = "2026-01-03T00:00:00.000Z";
    remote.listOwnedTripIds.mockResolvedValue(["trip-a"]);
    remote.getBundle.mockResolvedValue(bundle);
    const { actionPullOwnedTrips } = await import(
      "@/lib/sqlite/model/companion-trip-sync"
    );

    await expect(actionPullOwnedTrips(1, 0)).resolves.toEqual({
      processed: 1,
      nextOffset: 1,
      hasMore: true,
    });
    expect(remote.listOwnedTripIds).toHaveBeenCalledWith(1, 0);
    expect(remote.getBundle).toHaveBeenCalledWith("trip-a");
    await expect(
      testDb.getFirstAsync<{ title: string }>("select title from trip where id = ?", [
        "trip-a",
      ]),
    ).resolves.toEqual({ title: "Fresh remote title" });
    await expect(
      testDb.getFirstAsync<{ deleted_at: string | null }>(
        "select deleted_at from checklist_item where id = ?",
        ["checklist-a"],
      ),
    ).resolves.toEqual({ deleted_at: "2026-01-03T00:00:00.000Z" });
  });
});
