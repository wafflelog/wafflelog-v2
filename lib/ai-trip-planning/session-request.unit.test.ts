import { type AiPlannerIntakeAnswers } from "@/types/ai-trip-planner";
import { describe, expect, it } from "vitest";

import { AI_PLANNER_TRIP_BRIEF_MAX_LENGTH } from "./intake-validation";
import {
  buildCreatePlanningSessionRequest,
  getPlanningStartDateBriefPrefix,
  getPlanningTripBriefInputLimit,
} from "./session-request";

const answers: AiPlannerIntakeAnswers = {
  destination: " Osaka, Japan ",
  startDate: "2026-10-12",
  durationDays: 4,
  tripBrief: " A relaxed food and culture trip. ",
};

describe("AI planning session request builder", () => {
  it("adds unambiguous start-date context to the API trip brief", () => {
    expect(buildCreatePlanningSessionRequest(answers, "en-GB")).toEqual({
      destination: "Osaka, Japan",
      durationDays: 4,
      tripBrief:
        "Trip start date: 2026-10-12.\n\nA relaxed food and culture trip.",
      locale: "en-GB",
    });
  });

  it("reserves prefix space from the API trip-brief limit", () => {
    const prefix = getPlanningStartDateBriefPrefix(answers.startDate);

    expect(getPlanningTripBriefInputLimit(answers.startDate)).toBe(
      AI_PLANNER_TRIP_BRIEF_MAX_LENGTH - prefix.length,
    );
    expect(
      buildCreatePlanningSessionRequest(
        {
          ...answers,
          tripBrief: "a".repeat(
            getPlanningTripBriefInputLimit(answers.startDate),
          ),
        },
        "en-GB",
      ).tripBrief,
    ).toHaveLength(AI_PLANNER_TRIP_BRIEF_MAX_LENGTH);
  });

  it("rejects a combined brief beyond the API limit", () => {
    expect(() =>
      buildCreatePlanningSessionRequest(
        {
          ...answers,
          tripBrief: "a".repeat(
            getPlanningTripBriefInputLimit(answers.startDate) + 1,
          ),
        },
        "en-GB",
      ),
    ).toThrow("Combined trip brief must be 4,000 characters or fewer.");
  });
});
