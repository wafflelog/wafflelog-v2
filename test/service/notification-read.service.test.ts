import { describe, expect, it } from "vitest";

import { createTestUser } from "./local-supabase";

describe("notification read-state RLS", () => {
  it("allows only the recipient to mark an invitation notification as read", async () => {
    const owner = await createTestUser("owner");
    const invitee = await createTestUser("invitee");
    const tripId = crypto.randomUUID();

    const { error: tripError } = await owner.client.from("trip").insert({
      id: tripId,
      user_id: owner.id,
      title: "Notification read-state service test trip",
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

    const { data: notification, error: notificationError } = await invitee.client
      .from("app_notification")
      .select("id, read_at")
      .eq("trip_invitation_id", invitation!.id)
      .eq("type", "trip_invited")
      .single();
    expect(notificationError).toBeNull();
    expect(notification).toEqual({ id: expect.any(String), read_at: null });

    const readAt = new Date().toISOString();
    const { data: readNotification, error: readError } = await invitee.client
      .from("app_notification")
      .update({ read_at: readAt })
      .eq("id", notification!.id)
      .select("id, read_at")
      .single();
    expect(readError).toBeNull();
    expect(readNotification).toMatchObject({ id: notification!.id });
    expect(new Date(readNotification!.read_at!).toISOString()).toBe(readAt);

    const { data: ownerUpdate, error: ownerUpdateError } = await owner.client
      .from("app_notification")
      .update({ read_at: null })
      .eq("id", notification!.id)
      .select("id, read_at");
    expect(ownerUpdateError).toBeNull();
    expect(ownerUpdate).toEqual([]);

    const { data: remainingNotification, error: remainingNotificationError } =
      await invitee.client
        .from("app_notification")
        .select("id, read_at")
        .eq("id", notification!.id)
        .single();
    expect(remainingNotificationError).toBeNull();
    expect(remainingNotification).toMatchObject({ id: notification!.id });
    expect(new Date(remainingNotification!.read_at!).toISOString()).toBe(readAt);
  });
});
