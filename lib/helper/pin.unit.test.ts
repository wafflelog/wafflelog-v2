import { describe, expect, it } from "vitest";

import {
    buildTransportMetadata,
    getPinHeaderTimeLabel,
    getPinSubtitle,
    getPinTimeLabelForDate,
    getPinTitle,
    isRangePinCategory,
} from "./pin";

describe("isRangePinCategory", () => {
  it("returns true for range-based categories", () => {
    expect(isRangePinCategory("event")).toBe(true);
    expect(isRangePinCategory("stay")).toBe(true);
  });

  it("returns false for non-range categories", () => {
    expect(isRangePinCategory("food")).toBe(false);
  });
});

describe("buildTransportMetadata", () => {
  it("trims departure and destination", () => {
    expect(
      buildTransportMetadata({
        departure: "  London  ",
        destination: "  Paris  ",
      }),
    ).toEqual({
      version: 1,
      departure: "London",
      destination: "Paris",
    });
  });

  it("omits empty departure and destination", () => {
    expect(
      buildTransportMetadata({
        departure: "  ",
        destination: "",
      }),
    ).toEqual({
      version: 1,
      departure: undefined,
      destination: undefined,
    });
  });
});

describe("getPinTitle", () => {
  it("uses a non-empty pin name first", () => {
    expect(
      getPinTitle({
        name: "  Dinner  ",
        category: { id: "food", name: "food" },
      }),
    ).toBe("Dinner");
  });

  it("uses transport metadata when no name is present", () => {
    expect(
      getPinTitle({
        categoryId: "transport",
        metadata: {
          departure: "London",
          destination: "Paris",
        },
      }),
    ).toBe("London -> Paris");
  });

  it("uses transport metadataJson when metadata is absent", () => {
    expect(
      getPinTitle({
        categoryId: "transport",
        metadataJson: {
          departure: "London",
          destination: "Paris",
        },
      }),
    ).toBe("London -> Paris");
  });

  it("uses location name when title metadata is absent", () => {
    expect(
      getPinTitle({
        location: {
          name: "British Museum",
        },
      }),
    ).toBe("British Museum");
  });

  it("ignores the unknown location placeholder", () => {
    expect(
      getPinTitle({
        category: { id: "attraction", name: "attraction" },
        location: {
          name: "Unknown location",
        },
      }),
    ).toBe("attraction");
  });

  it("falls back to category id then Pin", () => {
    expect(getPinTitle({ categoryId: "custom" })).toBe("custom");
    expect(getPinTitle({})).toBe("Pin");
  });
});

describe("getPinTimeLabelForDate", () => {
  it("formats a single-day pin with start and end time", () => {
    expect(
      getPinTimeLabelForDate(
        {
          startDate: "2026-07-15",
          endDate: null,
          time: "09:00",
          endTime: "11:00",
        },
        "2026-07-15",
      ),
    ).toBe("09:00 - 11:00");
  });

  it("formats a single-day pin with only an end time", () => {
    expect(
      getPinTimeLabelForDate(
        {
          startDate: "2026-07-15",
          endDate: null,
          time: null,
          endTime: "11:00",
        },
        "2026-07-15",
      ),
    ).toBe("ends at 11:00");
  });

  it("formats a multi-day pin on the start day", () => {
    expect(
      getPinTimeLabelForDate(
        {
          startDate: "2026-07-15",
          endDate: "2026-07-17",
          time: "09:00",
          endTime: "11:00",
        },
        "2026-07-15",
      ),
    ).toBe("09:00");
  });

  it("formats a multi-day pin on the end day", () => {
    expect(
      getPinTimeLabelForDate(
        {
          startDate: "2026-07-15",
          endDate: "2026-07-17",
          time: "09:00",
          endTime: "11:00",
        },
        "2026-07-17",
      ),
    ).toBe("ends at 11:00");
  });

  it("formats a multi-day pin on a middle day", () => {
    expect(
      getPinTimeLabelForDate(
        {
          startDate: "2026-07-15",
          endDate: "2026-07-17",
          time: "09:00",
          endTime: "11:00",
        },
        "2026-07-16",
      ),
    ).toBe("Full day");
  });
});

describe("getPinHeaderTimeLabel", () => {
  it("formats a single-day pin without time", () => {
    expect(
      getPinHeaderTimeLabel({
        startDate: "2026-07-15",
        endDate: null,
        time: null,
        endTime: null,
      }),
    ).toBe("15 Jul");
  });

  it("formats a single-day pin with start time", () => {
    expect(
      getPinHeaderTimeLabel({
        startDate: "2026-07-15",
        endDate: null,
        time: "09:00",
        endTime: null,
      }),
    ).toBe("15 Jul 09:00");
  });

  it("formats a single-day pin with start and end time", () => {
    expect(
      getPinHeaderTimeLabel({
        startDate: "2026-07-15",
        endDate: null,
        time: "09:00",
        endTime: "11:00",
      }),
    ).toBe("15 Jul 09:00 - 11:00");
  });

  it("formats a single-day pin with only end time", () => {
    expect(
      getPinHeaderTimeLabel({
        startDate: "2026-07-15",
        endDate: null,
        time: null,
        endTime: "11:00",
      }),
    ).toBe("15 Jul ends at 11:00");
  });

  it("formats a multi-day pin with start and end times", () => {
    expect(
      getPinHeaderTimeLabel({
        startDate: "2026-07-15",
        endDate: "2026-07-17",
        time: "09:00",
        endTime: "11:00",
      }),
    ).toBe("15 Jul 09:00 - 17 Jul 11:00");
  });
});

describe("getPinSubtitle", () => {
  it("uses transport route when a named transport pin has route metadata", () => {
    expect(
      getPinSubtitle({
        name: "Eurostar",
        category: { id: "transport", name: "transport", color: "blue" },
        metadata: {
          version: 1,
          departure: "London",
          destination: "Paris",
        },
        location: {
          name: "St Pancras",
          id: "location-1",
          address: "",
          latitude: 0,
          longitude: 0,
        },
      }),
    ).toBe("London -> Paris");
  });

  it("hides the unknown location placeholder", () => {
    expect(
      getPinSubtitle({
        name: null,
        category: { id: "food", name: "food", color: "orange" },
        metadata: { version: 1 },
        location: {
          name: "Unknown location",
          id: "location-1",
          address: "",
          latitude: 0,
          longitude: 0,
        },
      }),
    ).toBe("");
  });

  it("uses the location name by default", () => {
    expect(
      getPinSubtitle({
        name: null,
        category: { id: "food", name: "food", color: "orange" },
        metadata: { version: 1 },
        location: {
          name: "Borough Market",
          id: "location-1",
          address: "",
          latitude: 0,
          longitude: 0,
        },
      }),
    ).toBe("Borough Market");
  });
});
