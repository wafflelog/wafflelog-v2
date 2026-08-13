import { type PlanningResult } from "@/lib/ai-trip-planning/types";
import { describe, expect, it } from "vitest";

import { adaptPlanningResultToPlanPreview } from "./plan-adapter";

function planningResult(
  overrides: Partial<PlanningResult> = {},
): PlanningResult {
  return {
    schemaVersion: 1,
    title: "A relaxed trip to Osaka",
    destination: {
      name: "Osaka",
      country: "Japan",
      timezone: "Asia/Tokyo",
    },
    durationDays: 3,
    summary: "Food, culture and time to wander.",
    assumptions: ["Staying near Namba"],
    warnings: ["Check opening hours"],
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
    checklistSuggestions: [{ title: "Pack comfortable shoes" }],
    referenceLinks: [
      {
        title: "Osaka visitor guide",
        url: "https://example.com/osaka",
      },
    ],
    ...overrides,
  };
}

describe("planning result preview adapter", () => {
  it("maps a completed result into the draft preview", () => {
    const result = planningResult();

    expect(
      adaptPlanningResultToPlanPreview({
        result,
        revisionNumber: 2,
        startDate: "2026-10-12",
      }),
    ).toEqual({
      revision: 2,
      title: "A relaxed trip to Osaka",
      destination: "Osaka, Japan",
      dateRange: "12–14 Oct · 3 days",
      summary: "Food, culture and time to wander.",
      assumptions: ["Staying near Namba"],
      warnings: ["Check opening hours"],
      checklist: ["Pack comfortable shoes"],
      days: [
        {
          id: "day-1",
          label: "Day 1 · Mon 12 Oct",
          title: "Markets and old Osaka",
          summary: "A gentle first day.",
          items: [
            {
              id: "market",
              time: "10:30",
              title: "Kuromon Market",
              description: "Try local food at the market.",
              category: "food",
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
          id: "day-2",
          label: "Day 2 · Tue 13 Oct",
          title: "A greener day",
          summary: "Leave the city centre for a while.",
          items: [
            {
              id: "park",
              time: "Flexible",
              title: "Minoh Park",
              description: "Walk to the waterfall.",
              category: "nature",
              reason: "It gives the itinerary some breathing room.",
              sources: [],
            },
          ],
        },
      ],
    });
  });

  it("uses day-only labels when the local start date is unavailable", () => {
    const result = planningResult({ durationDays: 1 });
    const preview = adaptPlanningResultToPlanPreview({
      result,
      revisionNumber: 1,
      startDate: null,
    });

    expect(preview.dateRange).toBe("1 day");
    expect(preview.days.map((day) => day.label)).toEqual(["Day 1", "Day 2"]);
  });

  it("normalizes known categories and falls back deterministically", () => {
    const baseItem = planningResult().days[0].items[0];
    const result = planningResult({
      days: [
        {
          dayNumber: 1,
          title: "Category examples",
          description: "Category mapping examples.",
          items: [
            { ...baseItem, draftId: "museum", type: "place", category: "museum" },
            { ...baseItem, draftId: "train", type: "transport", category: null },
            { ...baseItem, draftId: "cafe", type: "activity", category: "Cafe" },
            { ...baseItem, draftId: "place", type: "place", category: null },
            { ...baseItem, draftId: "unknown", type: "note", category: "quiet" },
          ],
        },
      ],
    });

    const preview = adaptPlanningResultToPlanPreview({
      result,
      revisionNumber: 1,
    });

    expect(preview.days[0].items.map((item) => item.category)).toEqual([
      "attraction",
      "transport",
      "food",
      "attraction",
      "other",
    ]);
  });

  it("does not mutate or expose mutable arrays from the API result", () => {
    const result = planningResult();
    const originalResult = structuredClone(result);
    const preview = adaptPlanningResultToPlanPreview({
      result,
      revisionNumber: 1,
      startDate: "2026-12-31",
    });

    preview.assumptions.push("A local-only review assumption");
    preview.days[0].items[0].sources[0].title = "Changed in the preview";

    expect(result).toEqual(originalResult);
    expect(preview.dateRange).toBe("31 Dec 2026–2 Jan 2027 · 3 days");
  });
});
