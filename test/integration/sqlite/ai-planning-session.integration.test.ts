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

describe("local AI planning sessions", () => {
  beforeEach(async () => {
    testDb = createTestSqliteDatabase();
    const { initializeDatabase } = await import("@/lib/sqlite/init");
    await initializeDatabase();
  });

  afterEach(() => {
    testDb.close();
  });

  it("creates, reads, and lists sessions for their owning user", async () => {
    const {
      actionGetLocalAiPlanningSession,
      actionListLocalAiPlanningSessions,
      actionUpsertLocalAiPlanningSession,
    } = await import("@/lib/sqlite/model/ai-planning-session");

    const session = await actionUpsertLocalAiPlanningSession({
      id: "session-1",
      userId: "user-a",
      destination: "  Kyoto, Japan  ",
      durationDays: 3,
      startDate: "2026-10-12",
      activeJobId: "job-1",
      status: "queued",
    });

    expect(session).toMatchObject({
      id: "session-1",
      userId: "user-a",
      destination: "Kyoto, Japan",
      durationDays: 3,
      startDate: "2026-10-12",
      activeJobId: "job-1",
      status: "queued",
      importedTripId: null,
    });
    await expect(
      actionGetLocalAiPlanningSession("session-1", "user-a"),
    ).resolves.toEqual(session);
    await expect(
      actionGetLocalAiPlanningSession("session-1", "user-b"),
    ).resolves.toBeNull();
    await expect(actionListLocalAiPlanningSessions("user-a")).resolves.toEqual([
      session,
    ]);
    await expect(actionListLocalAiPlanningSessions("user-b")).resolves.toEqual(
      [],
    );
  });

  it("updates the active job and public progress", async () => {
    const {
      actionUpdateLocalAiPlanningSessionJob,
      actionUpsertLocalAiPlanningSession,
    } = await import("@/lib/sqlite/model/ai-planning-session");

    await actionUpsertLocalAiPlanningSession({
      id: "session-1",
      userId: "user-a",
      destination: "Kyoto",
      durationDays: 3,
      startDate: "2026-10-12",
      activeJobId: "job-1",
      status: "queued",
    });

    await expect(
      actionUpdateLocalAiPlanningSessionJob({
        id: "session-1",
        userId: "user-a",
        activeJobId: "job-2",
        status: "researching",
        progressStage: " destination_research ",
        progressMessage: " Researching neighbourhoods ",
      }),
    ).resolves.toMatchObject({
      activeJobId: "job-2",
      status: "researching",
      progressStage: "destination_research",
      progressMessage: "Researching neighbourhoods",
    });
  });

  it("upserts a recovered session without changing its owner", async () => {
    const {
      actionGetLocalAiPlanningSession,
      actionUpsertLocalAiPlanningSession,
    } = await import("@/lib/sqlite/model/ai-planning-session");

    await actionUpsertLocalAiPlanningSession({
      id: "session-1",
      userId: "user-a",
      destination: "Kyoto",
      durationDays: 3,
      startDate: "2026-10-12",
      activeJobId: "job-1",
      status: "queued",
    });
    await actionUpsertLocalAiPlanningSession({
      id: "session-1",
      userId: "user-a",
      destination: "Osaka",
      durationDays: 4,
      startDate: "2026-10-13",
      activeJobId: "job-2",
      status: "drafting",
    });

    await expect(
      actionGetLocalAiPlanningSession("session-1", "user-a"),
    ).resolves.toMatchObject({
      destination: "Osaka",
      durationDays: 4,
      activeJobId: "job-2",
      status: "drafting",
    });
    await expect(
      actionUpsertLocalAiPlanningSession({
        id: "session-1",
        userId: "user-b",
        destination: "Changed owner",
        durationDays: 2,
        startDate: "2026-10-14",
        activeJobId: "job-3",
        status: "queued",
      }),
    ).rejects.toThrow("Planning session could not be saved");
    await expect(
      actionGetLocalAiPlanningSession("session-1", "user-a"),
    ).resolves.toMatchObject({ destination: "Osaka" });
  });

  it("marks an import once and returns the existing trip on later attempts", async () => {
    const {
      actionMarkLocalAiPlanningSessionImported,
      actionUpsertLocalAiPlanningSession,
    } = await import("@/lib/sqlite/model/ai-planning-session");

    await actionUpsertLocalAiPlanningSession({
      id: "session-1",
      userId: "user-a",
      destination: "Kyoto",
      durationDays: 3,
      startDate: "2026-10-12",
      activeJobId: "job-1",
      status: "completed",
    });

    await expect(
      actionMarkLocalAiPlanningSessionImported(
        "session-1",
        "user-a",
        "trip-1",
      ),
    ).resolves.toMatchObject({
      status: "imported",
      activeJobId: null,
      importedTripId: "trip-1",
    });
    await expect(
      actionMarkLocalAiPlanningSessionImported(
        "session-1",
        "user-a",
        "trip-2",
      ),
    ).resolves.toMatchObject({ importedTripId: "trip-1" });
  });

  it("deletes only the owning user's local recovery record", async () => {
    const {
      actionDeleteLocalAiPlanningSession,
      actionGetLocalAiPlanningSession,
      actionUpsertLocalAiPlanningSession,
    } = await import("@/lib/sqlite/model/ai-planning-session");

    await actionUpsertLocalAiPlanningSession({
      id: "session-1",
      userId: "user-a",
      destination: "Kyoto",
      durationDays: 3,
      startDate: "2026-10-12",
      activeJobId: "job-1",
      status: "queued",
    });

    await actionDeleteLocalAiPlanningSession("session-1", "user-b");
    await expect(
      actionGetLocalAiPlanningSession("session-1", "user-a"),
    ).resolves.not.toBeNull();

    await actionDeleteLocalAiPlanningSession("session-1", "user-a");
    await expect(
      actionGetLocalAiPlanningSession("session-1", "user-a"),
    ).resolves.toBeNull();
  });

  it("rejects invalid local recovery metadata", async () => {
    const { actionUpsertLocalAiPlanningSession } = await import(
      "@/lib/sqlite/model/ai-planning-session"
    );

    await expect(
      actionUpsertLocalAiPlanningSession({
        id: "session-1",
        userId: "user-a",
        destination: " ",
        durationDays: 0,
        startDate: "2026-10-12",
        activeJobId: "job-1",
        status: "queued",
      }),
    ).rejects.toThrow("Duration must be at least one day");
  });
});
