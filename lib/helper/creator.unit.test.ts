import { describe, expect, it } from "vitest";

import { getCreatorDisplayName } from "./creator";

describe("getCreatorDisplayName", () => {
  it("returns Unknown creator when creator is missing", () => {
    expect(getCreatorDisplayName()).toBe("Unknown creator");
    expect(getCreatorDisplayName(null)).toBe("Unknown creator");
  });

  it("returns You for the current user", () => {
    expect(
      getCreatorDisplayName({
        username: "ka",
        isCurrentUser: true,
      }),
    ).toBe("You");
  });

  it("returns the username for another known user", () => {
    expect(
      getCreatorDisplayName({
        username: "companion",
        isCurrentUser: false,
      }),
    ).toBe("@companion");
  });

  it("returns Unknown creator for another user without a cached username", () => {
    expect(
      getCreatorDisplayName({
        username: null,
        isCurrentUser: false,
      }),
    ).toBe("Unknown creator");
  });
});
