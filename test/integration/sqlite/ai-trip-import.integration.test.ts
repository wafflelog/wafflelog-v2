import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { type PlanningResult } from "@/lib/ai-trip-planning/types";

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
  actionSoftDeleteRemoteChecklistItem: vi.fn(),
  actionSoftDeleteRemoteNote: vi.fn(),
  actionSoftDeleteRemotePin: vi.fn(),
  actionSoftDeleteRemoteReferenceLink: vi.fn(),
  actionSoftDeleteRemoteTrip: vi.fn(),
  actionUpdateRemoteChecklistItemFromLocal: vi.fn(),
  actionUpsertRemoteChecklistItemFromLocal: vi.fn(),
  actionUpsertRemoteNoteFromLocal: vi.fn(),
  actionUpsertRemotePinFromLocal: vi.fn(),
  actionUpsertRemoteReferenceLinkFromLocal: vi.fn(),
  actionUpsertRemoteTripFromLocal: vi.fn(),
}));

const planningResult: PlanningResult = {
  schemaVersion: 1,
  title: "A relaxed Osaka break",
  destination: {
    name: "Osaka",
    country: "Japan",
    timezone: "Asia/Tokyo",
  },
  durationDays: 2,
  summary: "Food, culture and time to wander.",
  assumptions: ["Staying near Namba"],
  warnings: ["Check seasonal opening hours"],
  days: [
    {
      dayNumber: 1,
      title: "Markets and old Osaka",
      description: "A gentle first day.",
      items: [
        {
          draftId: "market",
          type: "meal",
          title: "Kuromon Market",
          description: "Try local food at the market.",
          suggestedStartTime: "10:30",
          estimatedDurationMinutes: 120,
          category: null,
          location: {
            name: "Kuromon Market",
            searchQuery: "Kuromon Market Osaka",
            latitude: 34.6654,
            longitude: 135.5065,
            externalPlaceId: null,
          },
          reason: "It suits the requested food focus.",
          sources: [
            {
              title: "Official market website",
              url: "https://example.com/market",
            },
          ],
        },
      ],
    },
    {
      dayNumber: 2,
      title: "A greener day",
      description: "Leave the city centre for a while.",
      items: [
        {
          draftId: "park",
          type: "activity",
          title: "Minoh Park",
          description: "Walk to the waterfall.",
          suggestedStartTime: null,
          estimatedDurationMinutes: null,
          category: "nature",
          reason: "It gives the itinerary some breathing room.",
          sources: [],
        },
      ],
    },
  ],
  checklistSuggestions: [
    { title: "Pack comfortable shoes" },
    { title: "Book the airport train" },
  ],
  referenceLinks: [
    {
      title: "Osaka visitor guide",
      url: "https://example.com/osaka",
    },
  ],
};

async function createPlanningSession() {
  const { actionUpsertLocalAiPlanningSession } = await import(
    "@/lib/sqlite/model/ai-planning-session"
  );

  return actionUpsertLocalAiPlanningSession({
    id: "session-1",
    userId: "user-a",
    destination: "Osaka, Japan",
    durationDays: 2,
    startDate: "2026-10-12",
    activeJobId: "job-1",
    status: "completed",
  });
}

beforeEach(async () => {
  testDb = createTestSqliteDatabase();
  const { initializeDatabase } = await import("@/lib/sqlite/init");
  await initializeDatabase();
  await createPlanningSession();
});

afterEach(() => {
  testDb.close();
});

describe("AI trip import", () => {
  it("imports the complete selected plan into local records", async () => {
    const { actionImportAiPlanningResult } = await import(
      "@/lib/ai-trip-planning/trip-import"
    );
    const { actionGetLocalAiPlanningSession } = await import(
      "@/lib/sqlite/model/ai-planning-session"
    );
    const { actionListLocalChecklistItems } = await import(
      "@/lib/sqlite/model/checklist-item"
    );
    const { actionListLocalNotesByPin, actionListLocalNotesByTrip } =
      await import("@/lib/sqlite/model/note");
    const { actionListLocalPins } = await import("@/lib/sqlite/model/pin");
    const { actionListLocalReferenceLinksByTrip } = await import(
      "@/lib/sqlite/model/reference-link"
    );

    const imported = await actionImportAiPlanningResult({
      userId: "user-a",
      sessionId: "session-1",
      startDate: "2026-10-12",
      result: planningResult,
      selection: {
        itineraryItemIds: ["market", "park"],
        checklistItems: ["Pack comfortable shoes", "Book the airport train"],
      },
    });

    expect(imported.alreadyImported).toBe(false);
    expect(imported.trip).toMatchObject({
      title: "A relaxed Osaka break",
      startDate: "2026-10-12",
      endDate: "2026-10-13",
    });

    const pins = await actionListLocalPins(imported.trip.id, "user-a");
    expect(pins).toHaveLength(2);
    expect(pins).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "Kuromon Market",
          startDate: "2026-10-12",
          time: "10:30",
          categoryId: "food",
          location: expect.objectContaining({
            displayName: "Kuromon Market",
            placeId: "ai:session-1:market",
          }),
        }),
        expect.objectContaining({
          name: "Minoh Park",
          startDate: "2026-10-13",
          categoryId: "nature",
        }),
      ]),
    );

    await expect(
      actionListLocalChecklistItems(imported.trip.id, "user-a"),
    ).resolves.toHaveLength(2);
    await expect(
      actionListLocalNotesByTrip(imported.trip.id, "user-a"),
    ).resolves.toEqual([
      expect.objectContaining({
        text: expect.stringContaining("Check seasonal opening hours"),
      }),
    ]);

    const marketPin = pins.find((pin) => pin.name === "Kuromon Market")!;
    await expect(
      actionListLocalNotesByPin(marketPin.id, "user-a"),
    ).resolves.toEqual([
      expect.objectContaining({
        text: expect.stringContaining("Suggested duration: 120 minutes"),
      }),
    ]);

    const links = await actionListLocalReferenceLinksByTrip(
      imported.trip.id,
      "user-a",
    );
    expect(links).toHaveLength(2);
    expect(links).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ pinId: marketPin.id }),
        expect.objectContaining({ pinId: null }),
      ]),
    );
    await expect(
      actionGetLocalAiPlanningSession("session-1", "user-a"),
    ).resolves.toMatchObject({
      status: "imported",
      importedTripId: imported.trip.id,
    });
  });

  it("imports only the chosen draft and checklist items", async () => {
    const { actionImportAiPlanningResult } = await import(
      "@/lib/ai-trip-planning/trip-import"
    );
    const { actionListLocalChecklistItems } = await import(
      "@/lib/sqlite/model/checklist-item"
    );
    const { actionListLocalPins } = await import("@/lib/sqlite/model/pin");

    const imported = await actionImportAiPlanningResult({
      userId: "user-a",
      sessionId: "session-1",
      startDate: "2026-10-12",
      result: planningResult,
      selection: {
        itineraryItemIds: ["park"],
        checklistItems: ["Pack comfortable shoes"],
      },
    });

    await expect(
      actionListLocalPins(imported.trip.id, "user-a"),
    ).resolves.toEqual([
      expect.objectContaining({ name: "Minoh Park" }),
    ]);
    await expect(
      actionListLocalChecklistItems(imported.trip.id, "user-a"),
    ).resolves.toEqual([
      expect.objectContaining({ title: "Pack comfortable shoes" }),
    ]);
  });

  it("returns the existing trip when an imported session is accepted again", async () => {
    const { actionImportAiPlanningResult } = await import(
      "@/lib/ai-trip-planning/trip-import"
    );
    const { actionListLocalPins } = await import("@/lib/sqlite/model/pin");
    const { actionListLocalTrips } = await import("@/lib/sqlite/model/trip");
    const input = {
      userId: "user-a",
      sessionId: "session-1",
      startDate: "2026-10-12",
      result: planningResult,
      selection: {
        itineraryItemIds: ["market"],
        checklistItems: [],
      },
    };

    const first = await actionImportAiPlanningResult(input);
    const repeated = await actionImportAiPlanningResult(input);

    expect(repeated).toMatchObject({
      trip: { id: first.trip.id },
      alreadyImported: true,
    });
    await expect(actionListLocalTrips("user-a")).resolves.toHaveLength(1);
    await expect(
      actionListLocalPins(first.trip.id, "user-a"),
    ).resolves.toHaveLength(1);
  });

  it("rolls back every local record when the import fails", async () => {
    const { actionImportAiPlanningResult } = await import(
      "@/lib/ai-trip-planning/trip-import"
    );
    const { actionGetLocalAiPlanningSession } = await import(
      "@/lib/sqlite/model/ai-planning-session"
    );
    const { actionListLocalTrips } = await import("@/lib/sqlite/model/trip");

    await testDb.execAsync(`
      create trigger fail_ai_checklist_import
      before insert on checklist_item
      begin
        select raise(abort, 'forced checklist failure');
      end;
    `);

    await expect(
      actionImportAiPlanningResult({
        userId: "user-a",
        sessionId: "session-1",
        startDate: "2026-10-12",
        result: planningResult,
        selection: {
          itineraryItemIds: ["market"],
          checklistItems: ["Pack comfortable shoes"],
        },
      }),
    ).rejects.toThrow("forced checklist failure");

    await expect(actionListLocalTrips("user-a")).resolves.toEqual([]);
    await expect(
      actionGetLocalAiPlanningSession("session-1", "user-a"),
    ).resolves.toMatchObject({
      status: "completed",
      importedTripId: null,
    });
  });
});
