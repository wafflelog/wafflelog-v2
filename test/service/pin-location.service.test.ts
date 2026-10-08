import { describe, expect, it } from "vitest";

import { createTestUser } from "./local-supabase";

describe("pin location RLS", () => {
  it("allows active trip members to read a location while only its pin creator can write it", async () => {
    const owner = await createTestUser("loc_owner");
    const companion = await createTestUser("loc_companion");
    const unrelated = await createTestUser("loc_unrelated");
    const tripId = crypto.randomUUID();
    const pinId = crypto.randomUUID();

    const { error: tripError } = await owner.client.from("trip").insert({
      id: tripId,
      user_id: owner.id,
      title: "Location service test trip",
      start_date: "2026-05-01",
      end_date: "2026-05-04",
    });
    expect(tripError).toBeNull();

    const { error: pinError } = await owner.client.from("pin").insert({
      id: pinId,
      trip_id: tripId,
      user_id: owner.id,
      name: "Museum",
      start_date: "2026-05-01",
      category_id: "other",
    });
    expect(pinError).toBeNull();

    const { error: locationError } = await owner.client
      .from("pin_location")
      .insert({
        pin_id: pinId,
        user_id: owner.id,
        place_id: "museum-place",
        display_name: "City Museum",
        formatted_address: "1 Museum Road",
        latitude: 51.5,
        longitude: -0.12,
      });
    expect(locationError).toBeNull();

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

    const [companionLocation, unrelatedLocation] = await Promise.all([
      companion.client
        .from("pin_location")
        .select("pin_id, display_name")
        .eq("pin_id", pinId),
      unrelated.client
        .from("pin_location")
        .select("pin_id, display_name")
        .eq("pin_id", pinId),
    ]);
    expect(companionLocation.error).toBeNull();
    expect(companionLocation.data).toEqual([
      { pin_id: pinId, display_name: "City Museum" },
    ]);
    expect(unrelatedLocation.error).toBeNull();
    expect(unrelatedLocation.data).toEqual([]);

    const [companionUpdate, companionDelete] = await Promise.all([
      companion.client
        .from("pin_location")
        .update({ display_name: "Companion overwrite" })
        .eq("pin_id", pinId)
        .select("pin_id"),
      companion.client
        .from("pin_location")
        .delete()
        .eq("pin_id", pinId)
        .select("pin_id"),
    ]);
    expect(companionUpdate.error).toBeNull();
    expect(companionUpdate.data).toEqual([]);
    expect(companionDelete.error).toBeNull();
    expect(companionDelete.data).toEqual([]);

    const { data: updatedLocation, error: ownerUpdateError } =
      await owner.client
        .from("pin_location")
        .update({ display_name: "Updated Museum" })
        .eq("pin_id", pinId)
        .select("pin_id, display_name")
        .single();
    expect(ownerUpdateError).toBeNull();
    expect(updatedLocation).toEqual({
      pin_id: pinId,
      display_name: "Updated Museum",
    });
  });
});
