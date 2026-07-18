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

async function listTableNames() {
  const rows = await testDb.getAllAsync<{ name: string }>(
    `
      select name
      from sqlite_master
      where type = 'table'
      order by name
    `,
  );

  return rows.map((row) => row.name);
}

async function listColumnNames(tableName: string) {
  const rows = await testDb.getAllAsync<{ name: string }>(
    `pragma table_info(${tableName})`,
  );

  return rows.map((row) => row.name);
}

describe("initializeDatabase", () => {
  beforeEach(() => {
    testDb = createTestSqliteDatabase();
  });

  afterEach(() => {
    testDb.close();
  });

  it("creates the local SQLite schema", async () => {
    const { initializeDatabase } = await import("@/lib/sqlite/init");

    await initializeDatabase();

    expect(await listTableNames()).toEqual(
      expect.arrayContaining([
        "checklist_item",
        "document",
        "expense",
        "image",
        "note",
        "pin",
        "pin_location",
        "reference_link",
        "trip",
        "trip_membership",
        "user_profile",
      ]),
    );
  });

  it("creates companion-trip membership and profile tables", async () => {
    const { initializeDatabase } = await import("@/lib/sqlite/init");

    await initializeDatabase();

    expect(await listColumnNames("trip_membership")).toEqual(
      expect.arrayContaining([
        "trip_id",
        "user_id",
        "role",
        "status",
        "source",
        "created_at",
        "updated_at",
        "last_synced_at",
      ]),
    );
    expect(await listColumnNames("user_profile")).toEqual(
      expect.arrayContaining(["id", "username", "updated_at"]),
    );
  });

  it("creates current sync columns on trip child tables", async () => {
    const { initializeDatabase } = await import("@/lib/sqlite/init");

    await initializeDatabase();

    expect(await listColumnNames("checklist_item")).toEqual(
      expect.arrayContaining([
        "id",
        "trip_id",
        "user_id",
        "title",
        "completed",
        "sync_status",
        "last_synced_at",
        "sync_error",
        "deleted_at",
      ]),
    );
    expect(await listColumnNames("pin")).toEqual(
      expect.arrayContaining([
        "id",
        "trip_id",
        "user_id",
        "start_date",
        "end_date",
        "time",
        "end_time",
        "category_id",
        "metadata_json",
        "deleted_at",
      ]),
    );
    expect(await listColumnNames("expense")).toEqual(
      expect.arrayContaining([
        "id",
        "pin_id",
        "trip_id",
        "user_id",
        "description",
        "amount",
        "currency",
        "paid_by_user_id",
        "paid_by_name",
        "deleted_at",
      ]),
    );
  });

  it("is idempotent on an already initialized database", async () => {
    const { initializeDatabase } = await import("@/lib/sqlite/init");

    await initializeDatabase();
    await initializeDatabase();

    expect(await listTableNames()).toEqual(
      expect.arrayContaining(["trip", "pin", "trip_membership", "user_profile"]),
    );
  });
});

