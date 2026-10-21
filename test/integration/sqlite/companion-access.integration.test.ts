import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createTestSqliteDatabase,
  type TestSqliteDatabase,
} from "./test-db";

const remote = vi.hoisted(() => ({
  listMemberships: vi.fn(),
  removeLocalFile: vi.fn(),
}));

let testDb: TestSqliteDatabase;

async function seedCompanionTrip() {
  await testDb.execAsync(`
    insert into trip values (
      'trip-a', 'owner-a', 'Shared trip', '2026-05-01', '2026-05-03',
      '2026-01-01', '2026-01-02', 'synced', '2026-01-02', null, null
    );
    insert into trip_membership values (
      'trip-a', 'companion-a', 'companion', 'active', 'companion',
      '2026-01-01', '2026-01-02', '2026-01-02'
    );
    insert into pin values (
      'pin-a', 'trip-a', 'companion-a', 'Pending place', '2026-05-01', null,
      null, null, 'place', '{"version":1}', '2026-01-01', '2026-01-02',
      'pending', null, null, null
    );
    insert into document values (
      'document-a', 'trip-a', 'pin-a', 'companion-a', 'ticket.pdf',
      'application/pdf', 'file:///ticket.pdf', 'travel-documents', 'trip/a',
      null, '2026-01-01', '2026-01-02', 'pending', null, null, null
    );
    insert into image values (
      'image-a', 'pin-a', 'trip-a', 'companion-a', 'file:///photo.jpg',
      'images', 'trip/a', 'image/jpeg', 100, 100, null, '2026-01-01',
      '2026-01-02', 'pending', null, null, null
    );
  `);
}

vi.mock("@/lib/sqlite/client", () => ({
  get sqlite() {
    return testDb;
  },
}));

vi.mock("@/lib/supabase/actions", () => ({
  actionListCompanionMemberships: remote.listMemberships,
}));

vi.mock("@/lib/media/local-file", () => ({
  removeLocalFile: remote.removeLocalFile,
}));

describe("companion access reconciliation", () => {
  beforeEach(async () => {
    testDb = createTestSqliteDatabase();
    remote.listMemberships.mockReset();
    remote.removeLocalFile.mockReset();
    remote.removeLocalFile.mockResolvedValue(undefined);

    const { initializeDatabase } = await import("@/lib/sqlite/init");
    await initializeDatabase();
  });

  afterEach(() => {
    testDb.close();
  });

  it("purges cached data, pending edits, and media when access is revoked", async () => {
    await seedCompanionTrip();
    remote.listMemberships.mockResolvedValue([
      {
        id: "membership-a",
        tripId: "trip-a",
        userId: "companion-a",
        role: "companion",
        status: "disabled",
        disabledReason: "owner_disabled",
        createdAt: "2026-01-01",
        updatedAt: "2026-01-03",
      },
    ]);

    const { actionReconcileLocalCompanionAccess } = await import(
      "@/lib/sqlite/model/companion-access"
    );

    await actionReconcileLocalCompanionAccess("companion-a");

    expect(remote.removeLocalFile).toHaveBeenCalledWith("file:///ticket.pdf");
    expect(remote.removeLocalFile).toHaveBeenCalledWith("file:///photo.jpg");
    await expect(
      testDb.getFirstAsync("select id from trip where id = 'trip-a'"),
    ).resolves.toBeNull();
    await expect(
      testDb.getFirstAsync("select id from pin where trip_id = 'trip-a'"),
    ).resolves.toBeNull();
    await expect(
      testDb.getFirstAsync(
        "select trip_id from trip_membership where trip_id = 'trip-a'",
      ),
    ).resolves.toBeNull();
  });

  it("purges stale edits when a device missed the leave and rejoin window", async () => {
    await seedCompanionTrip();
    remote.listMemberships.mockResolvedValue([
      {
        id: "membership-a",
        tripId: "trip-a",
        userId: "companion-a",
        role: "companion",
        status: "active",
        disabledReason: null,
        createdAt: "2026-01-01",
        updatedAt: "2026-01-05",
      },
    ]);

    const { actionReconcileLocalCompanionAccess } = await import(
      "@/lib/sqlite/model/companion-access"
    );

    await actionReconcileLocalCompanionAccess("companion-a");

    await expect(
      testDb.getFirstAsync("select id from trip where id = 'trip-a'"),
    ).resolves.toBeNull();
    await expect(
      testDb.getFirstAsync("select id from pin where id = 'pin-a'"),
    ).resolves.toBeNull();
  });
});
