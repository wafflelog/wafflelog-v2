import { describe, expect, it } from "vitest";

import { getUserDisplayName } from "./user-display";

describe("getUserDisplayName", () => {
  it("returns You when the user IDs match", () => {
    expect(
      getUserDisplayName(
        { userId: "user-1", username: "traveller" },
        "user-1",
      ),
    ).toBe("You");
  });

  it("returns a normalized username when the user IDs differ", () => {
    expect(
      getUserDisplayName(
        { userId: "user-2", username: "@companion" },
        "user-1",
      ),
    ).toBe("@companion");
  });

  it("returns the requested fallback when the username is unavailable", () => {
    expect(
      getUserDisplayName(
        { userId: "user-2", username: null },
        "user-1",
        "Unknown creator",
      ),
    ).toBe("Unknown creator");
  });
});
