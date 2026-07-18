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
  actionSoftDeleteRemoteExpense: vi.fn(),
  actionUpsertRemoteExpenseFromLocal: vi.fn(),
}));

describe("local expenses", () => {
  beforeEach(async () => {
    testDb = createTestSqliteDatabase();
    const { initializeDatabase } = await import("@/lib/sqlite/init");
    await initializeDatabase();
  });

  afterEach(() => {
    testDb.close();
  });

  it("lists active trip expenses with creator, payer, pin, and location details", async () => {
    const {
      actionCreateLocalExpense,
      actionListLocalExpensesByPin,
      actionListLocalExpensesByTrip,
    } = await import("@/lib/sqlite/model/expense");

    await testDb.runAsync(
      "insert into user_profile (id, username, updated_at) values (?, ?, ?), (?, ?, ?)",
      [
        "user-a",
        "alice",
        "2026-01-01T00:00:00.000Z",
        "user-b",
        "bob",
        "2026-01-01T00:00:00.000Z",
      ],
    );
    await testDb.runAsync(
      `insert into pin
        (id, trip_id, user_id, name, start_date, end_date, time, end_time, category_id, metadata_json, created_at, updated_at, sync_status, last_synced_at, sync_error, deleted_at)
       values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        "pin-a",
        "trip-a",
        "user-a",
        "Dinner",
        "2026-05-01",
        null,
        null,
        null,
        "food",
        '{"version":1,"destination":"Restaurant"}',
        "2026-01-01T00:00:00.000Z",
        "2026-01-01T00:00:00.000Z",
        "synced",
        null,
        null,
        null,
      ],
    );
    await testDb.runAsync(
      `insert into pin_location
        (pin_id, user_id, place_id, display_name, formatted_address, image_url, local_image_uri, rating, review_count, latitude, longitude, created_at, updated_at)
       values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        "pin-a",
        "user-a",
        "place-a",
        "The Bistro",
        "1 Main Street",
        null,
        null,
        null,
        null,
        0,
        0,
        "2026-01-01T00:00:00.000Z",
        "2026-01-01T00:00:00.000Z",
      ],
    );

    const older = await actionCreateLocalExpense({
      pinId: "pin-a",
      tripId: "trip-a",
      userId: "user-a",
      description: "  Lunch  ",
      amount: 24.5,
      currency: " GBP ",
      paidByUserId: "user-b",
      paidByName: "  Bob  ",
    });
    const newer = await actionCreateLocalExpense({
      tripId: "trip-a",
      userId: "user-b",
      description: "Coffee",
      amount: 4,
      currency: "GBP",
      paidByUserId: "missing-user",
      paidByName: "Guest",
    });
    const deleted = await actionCreateLocalExpense({
      tripId: "trip-a",
      userId: "user-a",
      description: "Deleted",
      amount: 1,
      currency: "GBP",
      paidByUserId: "user-a",
      paidByName: "Alice",
    });

    await testDb.runAsync("update expense set created_at = ? where id = ?", [
      "2026-01-01T09:00:00.000Z",
      older.id,
    ]);
    await testDb.runAsync("update expense set created_at = ? where id = ?", [
      "2026-01-02T09:00:00.000Z",
      newer.id,
    ]);
    await testDb.runAsync("update expense set deleted_at = ? where id = ?", [
      "2026-01-03T09:00:00.000Z",
      deleted.id,
    ]);

    expect(older).toMatchObject({
      description: "Lunch",
      currency: "GBP",
      paidByName: "Bob",
      syncStatus: "pending",
    });
    await expect(actionListLocalExpensesByTrip("trip-a", "user-a")).resolves.toEqual([
      expect.objectContaining({
        id: newer.id,
        creator: { userId: "user-b", username: "bob", isCurrentUser: false },
        paidByUsername: null,
        pin: null,
      }),
      expect.objectContaining({
        id: older.id,
        creator: { userId: "user-a", username: "alice", isCurrentUser: true },
        paidByUsername: "bob",
        pin: {
          id: "pin-a",
          name: "Dinner",
          categoryId: "food",
          metadataJson: { version: 1, destination: "Restaurant" },
          location: { displayName: "The Bistro" },
        },
      }),
    ]);
    await expect(actionListLocalExpensesByPin("pin-a", "user-a")).resolves.toEqual([
      expect.objectContaining({ id: older.id, paidByUsername: "bob" }),
    ]);
  });

  it("only lets the owner soft- or hard-delete a local expense", async () => {
    const {
      actionCreateLocalExpense,
      actionHardDeleteLocalExpense,
      actionListLocalExpensesByTrip,
      actionSoftDeleteLocalExpense,
    } = await import("@/lib/sqlite/model/expense");
    const expense = await actionCreateLocalExpense({
      tripId: "trip-a",
      userId: "user-a",
      description: "Taxi",
      amount: 18,
      currency: "GBP",
      paidByUserId: "user-a",
      paidByName: "Alice",
    });

    await actionSoftDeleteLocalExpense(expense.id, "user-b");
    await expect(actionListLocalExpensesByTrip("trip-a", "user-a")).resolves.toHaveLength(
      1,
    );

    await actionHardDeleteLocalExpense(expense.id, "user-b");
    await expect(actionListLocalExpensesByTrip("trip-a", "user-a")).resolves.toHaveLength(
      1,
    );

    await actionSoftDeleteLocalExpense(expense.id, "user-a");
    await expect(actionListLocalExpensesByTrip("trip-a", "user-a")).resolves.toEqual([]);

    await actionHardDeleteLocalExpense(expense.id, "user-a");
    await expect(
      testDb.getFirstAsync<{ id: string }>(
        "select id from expense where id = ?",
        [expense.id],
      ),
    ).resolves.toBeNull();
  });

  it("persists local expense sync state transitions", async () => {
    const {
      actionCreateLocalExpense,
      actionMarkLocalExpenseSyncFailed,
      actionMarkLocalExpenseSynced,
      actionMarkLocalExpenseSyncing,
    } = await import("@/lib/sqlite/model/expense");
    const expense = await actionCreateLocalExpense({
      tripId: "trip-a",
      userId: "user-a",
      description: "Museum tickets",
      amount: 30,
      currency: "GBP",
      paidByUserId: "user-a",
      paidByName: "Alice",
    });

    await actionMarkLocalExpenseSyncFailed(
      expense.id,
      "user-a",
      "Network error",
    );
    await actionMarkLocalExpenseSyncing(expense.id, "user-a");
    await expect(
      testDb.getFirstAsync<{
        sync_status: string;
        sync_error: string | null;
      }>("select sync_status, sync_error from expense where id = ?", [expense.id]),
    ).resolves.toEqual({ sync_status: "syncing", sync_error: null });

    await actionMarkLocalExpenseSynced(expense.id, "user-a");
    await expect(
      testDb.getFirstAsync<{
        sync_status: string;
        last_synced_at: string | null;
        sync_error: string | null;
      }>(
        "select sync_status, last_synced_at, sync_error from expense where id = ?",
        [expense.id],
      ),
    ).resolves.toMatchObject({
      sync_status: "synced",
      sync_error: null,
      last_synced_at: expect.any(String),
    });
  });

  it("selects the oldest unsynced expenses owned by the user", async () => {
    const {
      actionCreateLocalExpense,
      actionListPendingLocalExpenses,
      actionMarkLocalExpenseSynced,
    } = await import("@/lib/sqlite/model/expense");
    const oldest = await actionCreateLocalExpense({
      tripId: "trip-a",
      userId: "user-a",
      description: "Oldest",
      amount: 1,
      currency: "GBP",
      paidByUserId: "user-a",
      paidByName: "Alice",
    });
    const middle = await actionCreateLocalExpense({
      tripId: "trip-a",
      userId: "user-a",
      description: "Middle",
      amount: 2,
      currency: "GBP",
      paidByUserId: "user-a",
      paidByName: "Alice",
    });
    const synced = await actionCreateLocalExpense({
      tripId: "trip-a",
      userId: "user-a",
      description: "Synced",
      amount: 3,
      currency: "GBP",
      paidByUserId: "user-a",
      paidByName: "Alice",
    });
    const otherUser = await actionCreateLocalExpense({
      tripId: "trip-a",
      userId: "user-b",
      description: "Other user",
      amount: 4,
      currency: "GBP",
      paidByUserId: "user-b",
      paidByName: "Bob",
    });

    for (const [id, createdAt] of [
      [oldest.id, "2026-01-01T00:00:00.000Z"],
      [middle.id, "2026-01-02T00:00:00.000Z"],
      [synced.id, "2026-01-03T00:00:00.000Z"],
      [otherUser.id, "2026-01-04T00:00:00.000Z"],
    ]) {
      await testDb.runAsync("update expense set created_at = ? where id = ?", [
        createdAt,
        id,
      ]);
    }
    await actionMarkLocalExpenseSynced(synced.id, "user-a");

    await expect(actionListPendingLocalExpenses("user-a", 1)).resolves.toEqual([
      expect.objectContaining({ id: oldest.id }),
    ]);
    await expect(actionListPendingLocalExpenses("user-a")).resolves.toEqual([
      expect.objectContaining({ id: oldest.id }),
      expect.objectContaining({ id: middle.id }),
    ]);
  });
});
