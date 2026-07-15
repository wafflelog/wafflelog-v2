import { beforeEach, describe, expect, it, vi } from "vitest";

import {
    formatCreatedAt,
    formatDate,
    formatDateRange,
    formatTime,
    getFontFamily,
} from "./utils";

const platformSelectMock = vi.hoisted(() =>
  vi.fn(
    (options: { ios?: unknown; android?: unknown; default?: unknown }) =>
      options.ios ?? options.default,
  ),
);

vi.mock("react-native", () => ({
  Platform: {
    select: platformSelectMock,
  },
}));

beforeEach(() => {
  platformSelectMock.mockClear();
});

describe("formatDate", () => {
  it("formats a date with the long format by default", () => {
    expect(formatDate("2026-07-15")).toBe("15 Jul 2026");
  });

  it("formats a date with the short format", () => {
    expect(formatDate("2026-07-15", "short")).toBe("15 Jul");
  });
});

describe("formatDateRange", () => {
  it("formats a start and end date", () => {
    expect(formatDateRange("2026-07-15", "2026-07-20")).toBe(
      "15 Jul 2026 - 20 Jul 2026",
    );
  });
});

describe("formatTime", () => {
  it("formats a local timestamp as hours and minutes", () => {
    expect(formatTime("2026-07-15T09:30:00")).toBe("09:30");
  });
});

describe("formatCreatedAt", () => {
  it("formats a same-day timestamp as hours and minutes", () => {
    expect(formatCreatedAt("2026-07-15T09:30:00", "2026-07-15T18:45:00")).toBe(
      "09:30",
    );
  });

  it("formats a same-month timestamp as date and month", () => {
    expect(formatCreatedAt("2026-07-03T09:30:00", "2026-07-15T18:45:00")).toBe(
      "03 Jul",
    );
  });

  it("formats an older timestamp as month and year", () => {
    expect(formatCreatedAt("2026-06-30T09:30:00", "2026-07-15T18:45:00")).toBe(
      "Jun 2026",
    );
  });
});

describe("getFontFamily", () => {
  it("returns the regular font family by default", () => {
    expect(getFontFamily()).toBe("Montserrat-Regular");
    expect(platformSelectMock).toHaveBeenCalledWith({
      android: "Montserrat_400Regular",
      ios: "Montserrat-Regular",
    });
  });

  it("returns the medium font family for weight 500", () => {
    expect(getFontFamily("500")).toBe("Montserrat-Medium");
    expect(platformSelectMock).toHaveBeenCalledWith({
      android: "Montserrat_500Medium",
      ios: "Montserrat-Medium",
    });
  });

  it("returns the semi-bold font family for weight 600", () => {
    expect(getFontFamily("600")).toBe("Montserrat-SemiBold");
    expect(platformSelectMock).toHaveBeenCalledWith({
      android: "Montserrat_600SemiBold",
      ios: "Montserrat-SemiBold",
    });
  });

  it("returns the bold font family for weight 700", () => {
    expect(getFontFamily("700")).toBe("Montserrat-Bold");
    expect(platformSelectMock).toHaveBeenCalledWith({
      android: "Montserrat_700Bold",
      ios: "Montserrat-Bold",
    });
  });
});
