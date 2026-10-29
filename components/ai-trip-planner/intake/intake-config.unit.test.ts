import { describe, expect, it } from "vitest";

import { getPlanningTripBriefInputLimit } from "@/lib/ai-trip-planning/session-request";

import { validateIntakeField } from "./intake-config";

describe("AI planning intake field validation", () => {
  it("rejects an excessive destination instead of accepting truncated text", () => {
    expect(validateIntakeField("destination", "a".repeat(257), {})).toEqual({
      success: false,
      error: "Destination must be 256 characters or fewer.",
    });
  });

  it("rejects an excessive trip brief after reserving start-date context", () => {
    const startDate = "2026-11-12";
    const briefLimit = getPlanningTripBriefInputLimit(startDate);

    expect(
      validateIntakeField(
        "tripBrief",
        "a".repeat(briefLimit + 1),
        { startDate },
      ),
    ).toEqual({
      success: false,
      error: `Trip brief must be ${briefLimit.toLocaleString("en-GB")} characters or fewer.`,
    });
  });
});
