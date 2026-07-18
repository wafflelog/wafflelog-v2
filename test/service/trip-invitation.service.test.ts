import { describe, expect, it } from "vitest";

import { createTestUser } from "./local-supabase";

describe("trip invitation RLS and lifecycle", () => {
  it("lets an invitee accept an owner invitation, then grants companion trip access", async () => {
    const owner = await createTestUser("owner");
    const invitee = await createTestUser("invitee");
    const unrelated = await createTestUser("unrelated");
    const tripId = crypto.randomUUID();

    const { error: tripError } = await owner.client.from("trip").insert({
      id: tripId,
      user_id: owner.id,
      title: "Invitation service test trip",
      start_date: "2026-05-01",
      end_date: "2026-05-04",
    });
    expect(tripError).toBeNull();

    const { data: invitation, error: invitationError } = await owner.client
      .from("trip_invitation")
      .insert({
        trip_id: tripId,
        inviter_user_id: owner.id,
        invitee_user_id: invitee.id,
      })
      .select("id, status")
      .single();
    expect(invitationError).toBeNull();
    expect(invitation).toMatchObject({ status: "pending" });
    expect(invitation?.id).toBeTruthy();

    const [inviteeInvitation, unrelatedInvitation] = await Promise.all([
      invitee.client.from("trip_invitation").select("id").eq("id", invitation!.id),
      unrelated.client.from("trip_invitation").select("id").eq("id", invitation!.id),
    ]);
    expect(inviteeInvitation.error).toBeNull();
    expect(inviteeInvitation.data).toEqual([{ id: invitation!.id }]);
    expect(unrelatedInvitation.error).toBeNull();
    expect(unrelatedInvitation.data).toEqual([]);

    const { data: acceptedInvitation, error: acceptError } = await invitee.client
      .from("trip_invitation")
      .update({ status: "accepted" })
      .eq("id", invitation!.id)
      .select("id, status")
      .single();
    expect(acceptError).toBeNull();
    expect(acceptedInvitation).toEqual({ id: invitation!.id, status: "accepted" });

    const [companionTrip, companionMembership, unrelatedTrip] = await Promise.all([
      invitee.client.from("trip").select("id").eq("id", tripId),
      invitee.client
        .from("trip_member")
        .select("trip_id, user_id, role, status, created_from_invitation_id")
        .eq("trip_id", tripId),
      unrelated.client.from("trip").select("id").eq("id", tripId),
    ]);
    expect(companionTrip.error).toBeNull();
    expect(companionTrip.data).toEqual([{ id: tripId }]);
    expect(companionMembership.error).toBeNull();
    expect(companionMembership.data).toEqual([
      {
        trip_id: tripId,
        user_id: invitee.id,
        role: "companion",
        status: "active",
        created_from_invitation_id: invitation!.id,
      },
    ]);
    expect(unrelatedTrip.error).toBeNull();
    expect(unrelatedTrip.data).toEqual([]);

    const { error: unrelatedInviteError } = await unrelated.client
      .from("trip_invitation")
      .insert({
        trip_id: tripId,
        inviter_user_id: unrelated.id,
        invitee_user_id: owner.id,
      });
    expect(unrelatedInviteError).not.toBeNull();
  });
});
