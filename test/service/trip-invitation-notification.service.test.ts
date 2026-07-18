import { describe, expect, it } from "vitest";

import { createTestUser } from "./local-supabase";

describe("trip invitation notifications", () => {
  it("notifies the invitee and then the owner, with notifications isolated to their recipient", async () => {
    const owner = await createTestUser("owner");
    const invitee = await createTestUser("invitee");
    const unrelated = await createTestUser("unrelated");
    const tripId = crypto.randomUUID();

    const { error: tripError } = await owner.client.from("trip").insert({
      id: tripId,
      user_id: owner.id,
      title: "Notification service test trip",
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

    const [inviteeNotification, ownerInvitationNotification, unrelatedNotification] =
      await Promise.all([
        invitee.client
          .from("app_notification")
          .select("id, user_id, actor_user_id, trip_id, trip_invitation_id, type")
          .eq("trip_invitation_id", invitation!.id)
          .eq("type", "trip_invited"),
        owner.client
          .from("app_notification")
          .select("id")
          .eq("trip_invitation_id", invitation!.id)
          .eq("type", "trip_invited"),
        unrelated.client
          .from("app_notification")
          .select("id")
          .eq("trip_invitation_id", invitation!.id)
          .eq("type", "trip_invited"),
      ]);
    expect(inviteeNotification.error).toBeNull();
    expect(inviteeNotification.data).toEqual([
      {
        id: expect.any(String),
        user_id: invitee.id,
        actor_user_id: owner.id,
        trip_id: tripId,
        trip_invitation_id: invitation!.id,
        type: "trip_invited",
      },
    ]);
    expect(ownerInvitationNotification.error).toBeNull();
    expect(ownerInvitationNotification.data).toEqual([]);
    expect(unrelatedNotification.error).toBeNull();
    expect(unrelatedNotification.data).toEqual([]);

    const { error: acceptError } = await invitee.client
      .from("trip_invitation")
      .update({ status: "accepted" })
      .eq("id", invitation!.id);
    expect(acceptError).toBeNull();

    const { data: ownerResponseNotification, error: ownerResponseError } = await owner.client
      .from("app_notification")
      .select("id, user_id, actor_user_id, trip_id, trip_invitation_id, type")
      .eq("trip_invitation_id", invitation!.id)
      .eq("type", "trip_invite_accepted")
      .single();
    expect(ownerResponseError).toBeNull();
    expect(ownerResponseNotification).toEqual({
      id: expect.any(String),
      user_id: owner.id,
      actor_user_id: invitee.id,
      trip_id: tripId,
      trip_invitation_id: invitation!.id,
      type: "trip_invite_accepted",
    });

    const { data: inviteeResponseNotification, error: inviteeResponseError } =
      await invitee.client
        .from("app_notification")
        .select("id")
        .eq("id", ownerResponseNotification!.id);
    expect(inviteeResponseError).toBeNull();
    expect(inviteeResponseNotification).toEqual([]);
  });
});
