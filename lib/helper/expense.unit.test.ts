import { describe, expect, it } from "vitest";

import {
  calculateSharedExpenseLedger,
  getExpensePayerDisplayName,
  splitExpenseEqually,
} from "./expense";

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

describe("shared expense calculations", () => {
  it("splits equally and assigns remainders deterministically", () => {
    expect(splitExpenseEqually("10.00", ["cara", "alice", "bob"])).toEqual([
      { userId: "alice", splitAmount: "3.34" },
      { userId: "bob", splitAmount: "3.33" },
      { userId: "cara", splitAmount: "3.33" },
    ]);
  });

  it("calculates balances when the payer is excluded from the split", () => {
    const [ledger] = calculateSharedExpenseLedger([
      {
        id: "dinner",
        currency: "eur",
        amount: "90.00",
        paidByUserId: "bob",
        participants: [
          { userId: "bob", splitAmount: "45.00" },
          { userId: "cara", splitAmount: "45.00" },
        ],
      },
      {
        id: "museum",
        currency: "EUR",
        amount: "20.00",
        paidByUserId: "bob",
        participants: [{ userId: "cara", splitAmount: "20.00" }],
      },
    ]);

    expect(ledger).toEqual({
      currency: "EUR",
      balances: [
        { userId: "bob", paid: "110.00", owed: "45.00", net: "65.00" },
        { userId: "cara", paid: "0.00", owed: "65.00", net: "-65.00" },
      ],
      settlements: [{ fromUserId: "cara", toUserId: "bob", amount: "65.00" }],
    });
  });

  it("adds decimal split amounts exactly", () => {
    const [ledger] = calculateSharedExpenseLedger([
      {
        id: "precise",
        currency: "EUR",
        amount: "0.30",
        paidByUserId: "alice",
        participants: [
          { userId: "alice", splitAmount: "0.10" },
          { userId: "bob", splitAmount: "0.20" },
        ],
      },
    ]);

    expect(ledger.balances).toEqual([
      { userId: "alice", paid: "0.30", owed: "0.10", net: "0.20" },
      { userId: "bob", paid: "0.00", owed: "0.20", net: "-0.20" },
    ]);
  });

  it("keeps currencies separate and produces deterministic settlements", () => {
    const ledger = calculateSharedExpenseLedger([
      {
        id: "gbp-1",
        currency: "GBP",
        amount: "30.00",
        paidByUserId: "alice",
        participants: [
          { userId: "alice", splitAmount: "10.00" },
          { userId: "bob", splitAmount: "10.00" },
          { userId: "cara", splitAmount: "10.00" },
        ],
      },
      {
        id: "usd-1",
        currency: "USD",
        amount: "8.00",
        paidByUserId: "bob",
        participants: [
          { userId: "alice", splitAmount: "4.00" },
          { userId: "bob", splitAmount: "4.00" },
        ],
      },
    ]);

    expect(ledger).toEqual([
      {
        currency: "GBP",
        balances: [
          { userId: "alice", paid: "30.00", owed: "10.00", net: "20.00" },
          { userId: "bob", paid: "0.00", owed: "10.00", net: "-10.00" },
          { userId: "cara", paid: "0.00", owed: "10.00", net: "-10.00" },
        ],
        settlements: [
          { fromUserId: "bob", toUserId: "alice", amount: "10.00" },
          { fromUserId: "cara", toUserId: "alice", amount: "10.00" },
        ],
      },
      {
        currency: "USD",
        balances: [
          { userId: "alice", paid: "0.00", owed: "4.00", net: "-4.00" },
          { userId: "bob", paid: "8.00", owed: "4.00", net: "4.00" },
        ],
        settlements: [{ fromUserId: "alice", toUserId: "bob", amount: "4.00" }],
      },
    ]);
  });

  it("rejects invalid equal-split and ledger inputs", () => {
    expect(() => splitExpenseEqually("0.00", ["alice"])).toThrow(
      "Amount must be greater than zero",
    );
    expect(() => splitExpenseEqually("1.00", ["alice", "alice"])).toThrow(
      "Participants must be unique",
    );
    expect(() =>
      calculateSharedExpenseLedger([
        {
          id: "invalid",
          currency: "EUR",
          amount: "10.00",
          paidByUserId: "alice",
          participants: [{ userId: "bob", splitAmount: "9.99" }],
        },
      ]),
    ).toThrow("Participant split amounts must equal the expense amount");
  });
});
