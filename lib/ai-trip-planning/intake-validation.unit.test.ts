import { describe, expect, it } from "vitest";

import {
  AI_PLANNER_DESTINATION_MAX_LENGTH,
  AI_PLANNER_TRIP_BRIEF_MAX_LENGTH,
  validatePlanningDestination,
  validatePlanningDuration,
  validatePlanningStartDate,
  validatePlanningTripBrief,
} from "./intake-validation";

describe("AI planning intake validation", () => {
  it("trims and accepts a destination within the frontend limit", () => {
    expect(validatePlanningDestination("  Osaka, Japan  ")).toEqual({
      success: true,
      value: "Osaka, Japan",
    });
    expect(
      validatePlanningDestination(
        "a".repeat(AI_PLANNER_DESTINATION_MAX_LENGTH),
      ).success,
    ).toBe(true);
  });

  it("rejects an empty or over-limit destination", () => {
    expect(validatePlanningDestination("   ")).toEqual({
      success: false,
      error: "Tell me where you’re thinking of going.",
    });
    expect(
      validatePlanningDestination(
        "a".repeat(AI_PLANNER_DESTINATION_MAX_LENGTH + 1),
      ),
    ).toEqual({
      success: false,
      error: "Destination must be 256 characters or fewer.",
    });
  });

  it("accepts a valid start date that is not in the past", () => {
    expect(validatePlanningStartDate("2026-10-12", "2026-08-13")).toEqual({
      success: true,
      value: "2026-10-12",
    });
    expect(validatePlanningStartDate("2026-08-13", "2026-08-13")).toEqual({
      success: true,
      value: "2026-08-13",
    });
  });

  it("rejects missing, invalid, and past start dates", () => {
    expect(validatePlanningStartDate("", "2026-08-13")).toEqual({
      success: false,
      error: "Choose when you’d like the trip to start.",
    });
    expect(validatePlanningStartDate("2026-02-30", "2026-01-01")).toEqual({
      success: false,
      error: "Choose a valid start date.",
    });
    expect(validatePlanningStartDate("12/10/2026", "2026-01-01")).toEqual({
      success: false,
      error: "Choose a valid start date.",
    });
    expect(validatePlanningStartDate("2026-08-12", "2026-08-13")).toEqual({
      success: false,
      error: "Choose today or a future date.",
    });
  });

  it("accepts only whole-number durations from 1 to 30 days", () => {
    expect(validatePlanningDuration(" 4 ")).toEqual({
      success: true,
      value: 4,
    });

    for (const invalidInput of ["four", "2.5", "-2"]) {
      expect(validatePlanningDuration(invalidInput)).toEqual({
        success: false,
        error: "Enter the duration as a whole number of days.",
      });
    }

    for (const invalidInput of ["0", "31"]) {
      expect(validatePlanningDuration(invalidInput)).toEqual({
        success: false,
        error: "Choose a trip length between 1 and 30 days.",
      });
    }
  });

  it("rejects an empty duration", () => {
    expect(validatePlanningDuration(" ")).toEqual({
      success: false,
      error: "Tell me how many days you’d like to travel for.",
    });
  });

  it("trims and accepts a trip brief within the API limit", () => {
    expect(validatePlanningTripBrief("  Food and culture  ")).toEqual({
      success: true,
      value: "Food and culture",
    });
    expect(
      validatePlanningTripBrief(
        "a".repeat(AI_PLANNER_TRIP_BRIEF_MAX_LENGTH),
      ).success,
    ).toBe(true);
  });

  it("rejects an empty or over-limit trip brief", () => {
    expect(validatePlanningTripBrief("   ")).toEqual({
      success: false,
      error: "Tell me a little about the trip you’d enjoy.",
    });
    expect(
      validatePlanningTripBrief(
        "a".repeat(AI_PLANNER_TRIP_BRIEF_MAX_LENGTH + 1),
      ),
    ).toEqual({
      success: false,
      error: "Trip brief must be 4,000 characters or fewer.",
    });
  });
});
