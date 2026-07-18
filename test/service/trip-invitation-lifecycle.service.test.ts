import { describe, expect, it } from "vitest";

import { createTestUser } from "./local-supabase";

async function createTripInvitation() {
  const owner = await createTestUser("owner");
  const invitee = await createTestUser("invitee");
  const tripId = crypto.randomUUID();

  const { error: tripError } = await owner.client.from("trip").insert({
    id: tripId,
    user_id: owner.id,
    title: "Invitation lifecycle service test trip",
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
    .select("id")
    .single();
  expect(invitationError).toBeNull();
  expect(invitation?.id).toBeTruthy();

  return { owner, invitee, tripId, invitationId: invitation!.id };
}

describe("trip invitation lifecycle", () => {
  it("records rejection without creating membership, notifies the owner, and prevents later changes", async () => {
    const { owner, invitee, tripId, invitationId } = await createTripInvitation();

    const { data: rejectedInvitation, error: rejectError } = await invitee.client
      .from("trip_invitation")
      .update({ status: "rejected" })
      .eq("id", invitationId)
      .select("id, status")
      .single();
    expect(rejectError).toBeNull();
    expect(rejectedInvitation).toEqual({ id: invitationId, status: "rejected" });

    const [membership, rejectionNotification] = await Promise.all([
      owner.client
        .from("trip_member")
        .select("id")
        .eq("trip_id", tripId)
        .eq("user_id", invitee.id),
      owner.client
        .from("app_notification")
        .select("user_id, actor_user_id, trip_invitation_id, type")
        .eq("trip_invitation_id", invitationId)
        .eq("type", "trip_invite_rejected"),
    ]);
    expect(membership.error).toBeNull();
    expect(membership.data).toEqual([]);
    expect(rejectionNotification.error).toBeNull();
    expect(rejectionNotification.data).toEqual([
      {
        user_id: owner.id,
        actor_user_id: invitee.id,
        trip_invitation_id: invitationId,
        type: "trip_invite_rejected",
      },
    ]);

    const { data: laterUpdate, error: laterUpdateError } = await invitee.client
      .from("trip_invitation")
      .update({ status: "accepted" })
      .eq("id", invitationId)
      .select("id, status");
    expect(laterUpdateError).toBeNull();
    expect(laterUpdate).toEqual([]);
  });

  it("allows the owner to withdraw a pending invitation and prevents acceptance afterward", async () => {
    const { owner, invitee, tripId, invitationId } = await createTripInvitation();

    const { data: withdrawnInvitation, error: withdrawError } = await owner.client
      .from("trip_invitation")
      .update({ status: "withdrawn" })
      .eq("id", invitationId)
      .select("id, status")
      .single();
    expect(withdrawError).toBeNull();
    expect(withdrawnInvitation).toEqual({ id: invitationId, status: "withdrawn" });

    const { data: acceptance, error: acceptanceError } = await invitee.client
      .from("trip_invitation")
      .update({ status: "accepted" })
      .eq("id", invitationId)
      .select("id, status");
    expect(acceptanceError).toBeNull();
    expect(acceptance).toEqual([]);

    const { data: membership, error: membershipError } = await owner.client
      .from("trip_member")
      .select("id")
      .eq("trip_id", tripId)
      .eq("user_id", invitee.id);
    expect(membershipError).toBeNull();
    expect(membership).toEqual([]);
  });
});
