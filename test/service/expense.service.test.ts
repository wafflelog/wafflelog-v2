import { describe, expect, it } from "vitest";

import { createTestUser } from "./local-supabase";

describe("expense RLS", () => {
  it("allows active companions to create shared expenses with payer attribution", async () => {
    const owner = await createTestUser("owner");
    const companion = await createTestUser("companion");
    const unrelated = await createTestUser("unrelated");
    const tripId = crypto.randomUUID();
    const expenseId = crypto.randomUUID();

    const { error: tripError } = await owner.client.from("trip").insert({
      id: tripId,
      user_id: owner.id,
      title: "Expense service test trip",
      start_date: "2026-05-01",
      end_date: "2026-05-04",
    });
    expect(tripError).toBeNull();

    const { data: invitation, error: invitationError } = await owner.client
      .from("trip_invitation")
      .insert({
        trip_id: tripId,
        inviter_user_id: owner.id,
        invitee_user_id: companion.id,
      })
      .select("id")
      .single();
    expect(invitationError).toBeNull();
    expect(invitation?.id).toBeTruthy();

    const { error: acceptError } = await companion.client
      .from("trip_invitation")
      .update({ status: "accepted" })
      .eq("id", invitation!.id);
    expect(acceptError).toBeNull();

    const { data: createdExpense, error: expenseError } = await companion.client
      .from("expense")
      .insert({
        id: expenseId,
        trip_id: tripId,
        user_id: companion.id,
        description: "Flight tickets",
        amount: 249.5,
        currency: "GBP",
        paid_by_user_id: companion.id,
        paid_by_name: "Companion",
      })
      .select("id, user_id, paid_by_user_id, paid_by_name, amount, currency")
      .single();
    expect(expenseError).toBeNull();
    expect(createdExpense).toEqual({
      id: expenseId,
      user_id: companion.id,
      paid_by_user_id: companion.id,
      paid_by_name: "Companion",
      amount: 249.5,
      currency: "GBP",
    });

    const [ownerExpense, companionExpense, unrelatedExpense, unrelatedCreate] =
      await Promise.all([
        owner.client
          .from("expense")
          .select("id, user_id, paid_by_user_id, paid_by_name")
          .eq("id", expenseId),
        companion.client
          .from("expense")
          .select("id, user_id, paid_by_user_id, paid_by_name")
          .eq("id", expenseId),
        unrelated.client
          .from("expense")
          .select("id")
          .eq("id", expenseId),
        unrelated.client.from("expense").insert({
          id: crypto.randomUUID(),
          trip_id: tripId,
          user_id: unrelated.id,
          description: "Unauthorised expense",
          amount: 1,
          currency: "GBP",
          paid_by_user_id: unrelated.id,
          paid_by_name: "Unrelated",
        }),
      ]);
    const expectedExpense = {
      id: expenseId,
      user_id: companion.id,
      paid_by_user_id: companion.id,
      paid_by_name: "Companion",
    };
    expect(ownerExpense.error).toBeNull();
    expect(ownerExpense.data).toEqual([expectedExpense]);
    expect(companionExpense.error).toBeNull();
    expect(companionExpense.data).toEqual([expectedExpense]);
    expect(unrelatedExpense.error).toBeNull();
    expect(unrelatedExpense.data).toEqual([]);
    expect(unrelatedCreate.error).not.toBeNull();
  });
});
