import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createTestSqliteDatabase,
  type TestSqliteDatabase,
} from "./test-db";

const remote = vi.hoisted(() => ({
  getBundle: vi.fn(),
  listMemberships: vi.fn(),
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
    notes: [],
    referenceLinks: [],
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
    documents: [],
    images: [],
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
        paid_by_user_id: string;
        sync_status: string;
      }>("select paid_by_user_id, sync_status from expense where id = ?", [
        "expense-a",
      ]),
    ).resolves.toEqual({ paid_by_user_id: "companion-a", sync_status: "synced" });
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

  it("refreshes owned trips from remote bundles with paging and remote tombstones", async () => {
    const { actionCreateLocalTrip } = await import("@/lib/sqlite/model/trip");
    const firstTrip = await actionCreateLocalTrip({
      userId: "owner-a",
      title: "Stale first title",
      startDate: "2026-05-01",
      endDate: "2026-05-04",
    });
    const secondTrip = await actionCreateLocalTrip({
      userId: "owner-a",
      title: "Second trip",
      startDate: "2026-06-01",
      endDate: "2026-06-04",
    });
    await testDb.runAsync("update trip set updated_at = ? where id = ?", [
      "2026-01-02T00:00:00.000Z",
      firstTrip.id,
    ]);
    await testDb.runAsync("update trip set updated_at = ? where id = ?", [
      "2026-01-01T00:00:00.000Z",
      secondTrip.id,
    ]);
    const bundle = createBundle("Fresh remote title");
    bundle.trip.id = firstTrip.id;
    bundle.checklistItems[0].tripId = firstTrip.id;
    bundle.pins[0].tripId = firstTrip.id;
    bundle.expenses[0].tripId = firstTrip.id;
    bundle.checklistItems[0].deletedAt = "2026-01-03T00:00:00.000Z";
    remote.getBundle.mockResolvedValue(bundle);
    const { actionPullOwnedTrips } = await import(
      "@/lib/sqlite/model/companion-trip-sync"
    );

    await expect(actionPullOwnedTrips("owner-a", 1, 0)).resolves.toEqual({
      processed: 1,
      nextOffset: 1,
      hasMore: true,
    });
    expect(remote.getBundle).toHaveBeenCalledWith(firstTrip.id);
    await expect(
      testDb.getFirstAsync<{ title: string }>("select title from trip where id = ?", [
        firstTrip.id,
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
