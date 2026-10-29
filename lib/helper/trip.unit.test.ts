import { describe, expect, it } from "vitest";

import {
  getInitialTripDayIndex,
  getTripDurationDays,
  getTripProgress,
} from "./trip";

describe("getTripDurationDays", () => {
  it("calculates an inclusive trip duration", () => {
    expect(getTripDurationDays("2026-01-01", "2026-04-30")).toBe(120);
    expect(getTripDurationDays("2026-08-16", "2026-08-16")).toBe(1);
  });

  it("returns null for invalid or reversed ranges", () => {
    expect(getTripDurationDays("2026-08-18", "2026-08-16")).toBeNull();
    expect(getTripDurationDays("invalid", "2026-08-16")).toBeNull();
  });
});

describe("getInitialTripDayIndex", () => {
  it("selects today for an ongoing trip", () => {
    expect(
      getInitialTripDayIndex("2026-08-14", "2026-08-20", "2026-08-16"),
    ).toBe(2);
  });

  it("selects the first day for upcoming, past, or invalid trips", () => {
    expect(
      getInitialTripDayIndex("2026-08-14", "2026-08-20", "2026-08-01"),
    ).toBe(0);
    expect(
      getInitialTripDayIndex("2026-08-14", "2026-08-20", "2026-08-30"),
    ).toBe(0);
    expect(
      getInitialTripDayIndex("2026-08-20", "2026-08-14", "2026-08-16"),
    ).toBe(0);
  });
});

describe("getTripProgress", () => {
  it("calculates inclusive day and percentage values", () => {
    expect(
      getTripProgress("2026-08-14", "2026-08-20", "2026-08-16"),
    ).toEqual({
      currentDay: 3,
      totalDays: 7,
      percentage: 43,
    });
  });

  it("handles a one-day trip", () => {
    expect(
      getTripProgress("2026-08-16", "2026-08-16", "2026-08-16"),
    ).toEqual({
      currentDay: 1,
      totalDays: 1,
      percentage: 100,
    });
  });

  it("clamps progress to the trip date range", () => {
    expect(
      getTripProgress("2026-08-16", "2026-08-18", "2026-08-01"),
    ).toEqual({
      currentDay: 1,
      totalDays: 3,
      percentage: 33,
    });
    expect(
      getTripProgress("2026-08-16", "2026-08-18", "2026-08-30"),
    ).toEqual({
      currentDay: 3,
      totalDays: 3,
      percentage: 100,
    });
  });

  it("returns null for invalid date ranges", () => {
    expect(
      getTripProgress("2026-08-18", "2026-08-16", "2026-08-17"),
    ).toBeNull();
    expect(getTripProgress("invalid", "2026-08-16")).toBeNull();
  });
});
