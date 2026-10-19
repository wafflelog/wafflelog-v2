import { describe, expect, it } from "vitest";

import { adminClient, createTestUser } from "./local-supabase";

describe("account deletion cascades", () => {
  it("deletes expenses involving the removed companion without deleting the owner's trip", async () => {
    const owner = await createTestUser("delete_owner");
    const companion = await createTestUser("delete_companion");
    const tripId = crypto.randomUUID();
    const expenseId = crypto.randomUUID();

    const { error: tripError } = await owner.client.from("trip").insert({
      id: tripId,
      user_id: owner.id,
      title: "Account deletion cascade test",
      start_date: "2026-10-19",
      end_date: "2026-10-21",
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

    const { error: acceptError } = await companion.client
      .from("trip_invitation")
      .update({ status: "accepted" })
      .eq("id", invitation!.id);
    expect(acceptError).toBeNull();

    const { error: expenseError } = await owner.client.from("expense").insert({
      id: expenseId,
      trip_id: tripId,
      user_id: owner.id,
      description: "Companion-paid hotel",
      amount: 120,
      currency: "GBP",
      paid_by_user_id: companion.id,
      paid_by_name: "Companion",
    });
    expect(expenseError).toBeNull();

    const { error: participantError } = await owner.client
      .from("expense_participant")
      .insert([
        { expense_id: expenseId, user_id: owner.id, split_amount: 60 },
        { expense_id: expenseId, user_id: companion.id, split_amount: 60 },
      ]);
    expect(participantError).toBeNull();

    const { error: deletionError } =
      await adminClient.auth.admin.deleteUser(companion.id);
    expect(deletionError).toBeNull();

    const [trip, membership, expense, participants, deletedProfile] =
      await Promise.all([
        adminClient.from("trip").select("id").eq("id", tripId),
        adminClient
          .from("trip_member")
          .select("user_id")
          .eq("trip_id", tripId)
          .eq("user_id", companion.id),
        adminClient.from("expense").select("id").eq("id", expenseId),
        owner.client
          .from("expense_participant")
          .select("user_id")
          .eq("expense_id", expenseId),
        adminClient.from("user").select("id").eq("id", companion.id),
      ]);

    expect(trip.error).toBeNull();
    expect(trip.data).toEqual([{ id: tripId }]);
    expect(membership.error).toBeNull();
    expect(membership.data).toEqual([]);
    expect(expense.error).toBeNull();
    expect(expense.data).toEqual([]);
    expect(participants.error).toBeNull();
    expect(participants.data).toEqual([]);
    expect(deletedProfile.error).toBeNull();
    expect(deletedProfile.data).toEqual([]);
  });
});
