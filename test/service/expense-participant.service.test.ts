import { describe, expect, it, vi } from "vitest";

import { actionGetRemoteTripSyncBundle } from "@/lib/supabase/actions";
import { createTestUser } from "./local-supabase";

vi.mock("expo-secure-store", () => ({
  deleteItemAsync: vi.fn(),
  getItemAsync: vi.fn(),
  setItemAsync: vi.fn(),
}));

describe("expense participant RLS", () => {
  it("lets active companions discover everyone available for an expense split", async () => {
    const owner = await createTestUser("split_owner");
    const firstCompanion = await createTestUser("split_first");
    const secondCompanion = await createTestUser("split_second");
    const unrelated = await createTestUser("split_unrelated");
    const tripId = crypto.randomUUID();

    const { error: tripError } = await owner.client.from("trip").insert({
      id: tripId,
      user_id: owner.id,
      title: "Expense split membership test",
      start_date: "2026-08-01",
      end_date: "2026-08-03",
    });
    expect(tripError).toBeNull();

    for (const companion of [firstCompanion, secondCompanion]) {
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
    }

    const [companionRead, unrelatedRead] = await Promise.all([
      firstCompanion.client
        .from("trip_member")
        .select("user_id, status")
        .eq("trip_id", tripId)
        .order("user_id"),
      unrelated.client
        .from("trip_member")
        .select("user_id, status")
        .eq("trip_id", tripId),
    ]);

    expect(companionRead.error).toBeNull();
    expect(companionRead.data).toEqual(
      [
        { user_id: firstCompanion.id, status: "active" },
        { user_id: secondCompanion.id, status: "active" },
      ].sort((left, right) => left.user_id.localeCompare(right.user_id)),
    );
    expect(unrelatedRead.data).toEqual([]);

    const bundle = await actionGetRemoteTripSyncBundle(
      tripId,
      firstCompanion.client,
    );
    expect(
      bundle.tripMembers.map((membership) => membership.userId).sort(),
    ).toEqual([firstCompanion.id, secondCompanion.id].sort());
    expect(bundle.userProfiles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: owner.id }),
        expect.objectContaining({ id: firstCompanion.id }),
        expect.objectContaining({ id: secondCompanion.id }),
      ]),
    );

    const { error: disableError } = await owner.client
      .from("trip_member")
      .update({ status: "disabled", disabled_reason: "owner_disabled" })
      .eq("trip_id", tripId)
      .eq("user_id", secondCompanion.id);
    expect(disableError).toBeNull();

    const { data: activeMembersAfterDisable, error: activeMembersError } =
      await firstCompanion.client
        .from("trip_member")
        .select("user_id, status")
        .eq("trip_id", tripId);
    expect(activeMembersError).toBeNull();
    expect(activeMembersAfterDisable).toEqual([
      { user_id: firstCompanion.id, status: "active" },
    ]);
  });

  it("allows active members to record and read allocations, then revokes disabled access", async () => {
    const owner = await createTestUser("ledger_owner");
    const companion = await createTestUser("ledger_companion");
    const unrelated = await createTestUser("ledger_unrelated");
    const tripId = crypto.randomUUID();
    const expenseId = crypto.randomUUID();

    const { error: tripError } = await owner.client.from("trip").insert({
      id: tripId,
      user_id: owner.id,
      title: "Shared expense participant test",
      start_date: "2026-08-01",
      end_date: "2026-08-03",
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

    const { error: expenseError } = await companion.client
      .from("expense")
      .insert({
        id: expenseId,
        trip_id: tripId,
        user_id: companion.id,
        description: "Dinner",
        amount: 100,
        currency: "GBP",
        paid_by_user_id: companion.id,
        paid_by_name: "Companion",
      });
    expect(expenseError).toBeNull();

    const { data: participants, error: participantError } =
      await companion.client
        .from("expense_participant")
        .insert([
          { expense_id: expenseId, user_id: owner.id, split_amount: 50 },
          { expense_id: expenseId, user_id: companion.id, split_amount: 50 },
        ])
        .select("expense_id, user_id, split_amount");
    expect(participantError).toBeNull();
    expect(participants).toEqual([
      { expense_id: expenseId, user_id: owner.id, split_amount: 50 },
      { expense_id: expenseId, user_id: companion.id, split_amount: 50 },
    ]);

    const [ownerRead, companionRead, unrelatedRead, unrelatedInsert] =
      await Promise.all([
        owner.client
          .from("expense_participant")
          .select("user_id, split_amount")
          .eq("expense_id", expenseId)
          .order("user_id"),
        companion.client
          .from("expense_participant")
          .select("user_id, split_amount")
          .eq("expense_id", expenseId)
          .order("user_id"),
        unrelated.client
          .from("expense_participant")
          .select("user_id")
          .eq("expense_id", expenseId),
        unrelated.client.from("expense_participant").insert({
          expense_id: expenseId,
          user_id: unrelated.id,
          split_amount: 100,
        }),
      ]);
    expect(ownerRead.data).toHaveLength(2);
    expect(companionRead.data).toHaveLength(2);
    expect(unrelatedRead.data).toEqual([]);
    expect(unrelatedInsert.error).not.toBeNull();

    const { error: disableError } = await owner.client
      .from("trip_member")
      .update({ status: "disabled", disabled_reason: "owner_disabled" })
      .eq("trip_id", tripId)
      .eq("user_id", companion.id);
    expect(disableError).toBeNull();

    const [ownerHistoricalRead, disabledCompanionRead] = await Promise.all([
      owner.client
        .from("expense_participant")
        .select("user_id")
        .eq("expense_id", expenseId),
      companion.client
        .from("expense_participant")
        .select("user_id")
        .eq("expense_id", expenseId),
    ]);
    expect(ownerHistoricalRead.data).toHaveLength(2);
    expect(disabledCompanionRead.data).toEqual([]);
  });
});
