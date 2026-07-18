import { describe, expect, it } from "vitest";

import { createTestUser } from "./local-supabase";

describe("pin RLS", () => {
  it("allows companions to read pins, but only the creator can update or delete them", async () => {
    const owner = await createTestUser("owner");
    const companion = await createTestUser("companion");
    const unrelated = await createTestUser("unrelated");
    const tripId = crypto.randomUUID();
    const pinId = crypto.randomUUID();

    const { error: tripError } = await owner.client.from("trip").insert({
      id: tripId,
      user_id: owner.id,
      title: "Pin service test trip",
      start_date: "2026-05-01",
      end_date: "2026-05-04",
    });
    expect(tripError).toBeNull();

    const { error: pinError } = await owner.client.from("pin").insert({
      id: pinId,
      trip_id: tripId,
      user_id: owner.id,
      name: "Owner pin",
      start_date: "2026-05-01",
      category_id: "other",
    });
    expect(pinError).toBeNull();

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

    const [companionPin, unrelatedPin] = await Promise.all([
      companion.client.from("pin").select("id, name").eq("id", pinId),
      unrelated.client.from("pin").select("id, name").eq("id", pinId),
    ]);
    expect(companionPin.error).toBeNull();
    expect(companionPin.data).toEqual([{ id: pinId, name: "Owner pin" }]);
    expect(unrelatedPin.error).toBeNull();
    expect(unrelatedPin.data).toEqual([]);

    const { data: updatedPin, error: ownerUpdateError } = await owner.client
      .from("pin")
      .update({ name: "Renamed owner pin" })
      .eq("id", pinId)
      .select("id, name")
      .single();
    expect(ownerUpdateError).toBeNull();
    expect(updatedPin).toEqual({ id: pinId, name: "Renamed owner pin" });

    const [companionUpdate, companionDelete] = await Promise.all([
      companion.client
        .from("pin")
        .update({ name: "Companion overwrite" })
        .eq("id", pinId)
        .select("id"),
      companion.client.from("pin").delete().eq("id", pinId).select("id"),
    ]);
    expect(companionUpdate.error).toBeNull();
    expect(companionUpdate.data).toEqual([]);
    expect(companionDelete.error).toBeNull();
    expect(companionDelete.data).toEqual([]);

    const { data: remainingPin, error: remainingPinError } = await owner.client
      .from("pin")
      .select("id, name")
      .eq("id", pinId)
      .single();
    expect(remainingPinError).toBeNull();
    expect(remainingPin).toEqual({ id: pinId, name: "Renamed owner pin" });
  });
});
