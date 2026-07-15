import { describe, expect, it } from "vitest";

import { getExpensePayerDisplayName } from "./expense";

describe("getExpensePayerDisplayName", () => {
  it("returns You when the current user paid", () => {
    expect(
      getExpensePayerDisplayName({
        paidByUserId: "user-1",
        paidByName: "Someone",
        paidByUsername: "someone",
        currentUserId: "user-1",
      }),
    ).toBe("You");
  });

  it("returns the payer username when another known user paid", () => {
    expect(
      getExpensePayerDisplayName({
        paidByUserId: "user-2",
        paidByName: "Someone",
        paidByUsername: "companion",
        currentUserId: "user-1",
      }),
    ).toBe("@companion");
  });

  it("returns Unknown payer for an old synced You label from another user", () => {
    expect(
      getExpensePayerDisplayName({
        paidByUserId: "user-2",
        paidByName: "You",
        paidByUsername: null,
        currentUserId: "user-1",
      }),
    ).toBe("Unknown payer");
  });

  it("returns the stored payer name when another username is not cached", () => {
    expect(
      getExpensePayerDisplayName({
        paidByUserId: "user-2",
        paidByName: "Travel kitty",
        paidByUsername: null,
        currentUserId: "user-1",
      }),
    ).toBe("Travel kitty");
  });
});

