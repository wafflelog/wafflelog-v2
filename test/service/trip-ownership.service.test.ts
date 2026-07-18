import { describe, expect, it } from "vitest";

import { createTestUser } from "./local-supabase";

describe("trip ownership RLS", () => {
  it("allows only the owner to update or delete a trip", async () => {
    const owner = await createTestUser("owner");
    const companion = await createTestUser("companion");
    const unrelated = await createTestUser("unrelated");
    const tripId = crypto.randomUUID();

    const { error: tripError } = await owner.client.from("trip").insert({
      id: tripId,
      user_id: owner.id,
      title: "Original trip title",
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

    const { data: ownerUpdate, error: ownerUpdateError } = await owner.client
      .from("trip")
      .update({ title: "Owner-updated trip title" })
      .eq("id", tripId)
      .select("id, title")
      .single();
    expect(ownerUpdateError).toBeNull();
    expect(ownerUpdate).toEqual({ id: tripId, title: "Owner-updated trip title" });

    const [companionUpdate, companionDelete, unrelatedUpdate, unrelatedDelete] =
      await Promise.all([
        companion.client
          .from("trip")
          .update({ title: "Companion overwrite" })
          .eq("id", tripId)
          .select("id"),
        companion.client.from("trip").delete().eq("id", tripId).select("id"),
        unrelated.client
          .from("trip")
          .update({ title: "Unrelated overwrite" })
          .eq("id", tripId)
          .select("id"),
        unrelated.client.from("trip").delete().eq("id", tripId).select("id"),
      ]);
    expect(companionUpdate.error).toBeNull();
    expect(companionUpdate.data).toEqual([]);
    expect(companionDelete.error).toBeNull();
    expect(companionDelete.data).toEqual([]);
    expect(unrelatedUpdate.error).toBeNull();
    expect(unrelatedUpdate.data).toEqual([]);
    expect(unrelatedDelete.error).toBeNull();
    expect(unrelatedDelete.data).toEqual([]);

    const { data: remainingTrip, error: remainingTripError } = await owner.client
      .from("trip")
      .select("id, title")
      .eq("id", tripId)
      .single();
    expect(remainingTripError).toBeNull();
    expect(remainingTrip).toEqual({ id: tripId, title: "Owner-updated trip title" });
  });
});
