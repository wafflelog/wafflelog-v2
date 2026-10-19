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

describe("local account data cleanup", () => {
  beforeEach(async () => {
    testDb = createTestSqliteDatabase();
    const { initializeDatabase } = await import("@/lib/sqlite/init");
    await initializeDatabase();
  });

  afterEach(() => {
    testDb.close();
  });

  it("removes cached and user-created data while keeping the schema", async () => {
    const now = new Date().toISOString();

    await testDb.execAsync(`
      insert into user_profile (id, username, updated_at)
      values ('user-a', 'traveller', '${now}');

      insert into data_sync_state (user_id, initial_download_completed_at)
      values ('user-a', '${now}');

      insert into trip (
        id, user_id, title, start_date, end_date, created_at, updated_at,
        sync_status
      ) values (
        'trip-a', 'user-a', 'Kyoto', '2026-10-20', '2026-10-22',
        '${now}', '${now}', 'synced'
      );

      insert into ai_planning_session (
        id, user_id, destination, duration_days, start_date, status,
        created_at, updated_at
      ) values (
        'session-a', 'user-a', 'Kyoto', 3, '2026-10-20', 'completed',
        '${now}', '${now}'
      );
    `);

    const { actionClearLocalData } = await import(
      "@/lib/sqlite/clear-local-data"
    );
    await actionClearLocalData();

    const counts = await testDb.getFirstAsync<{
      profiles: number;
      syncStates: number;
      trips: number;
      planningSessions: number;
    }>(`
      select
        (select count(*) from user_profile) as profiles,
        (select count(*) from data_sync_state) as syncStates,
        (select count(*) from trip) as trips,
        (select count(*) from ai_planning_session) as planningSessions
    `);

    expect(counts).toEqual({
      profiles: 0,
      syncStates: 0,
      trips: 0,
      planningSessions: 0,
    });

    const tripTable = await testDb.getFirstAsync<{ name: string }>(
      "select name from sqlite_master where type = 'table' and name = 'trip'",
    );
    expect(tripTable).toEqual({ name: "trip" });
  });
});
