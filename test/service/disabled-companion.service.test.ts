import { describe, expect, it } from "vitest";

import { createTestUser } from "./local-supabase";

describe("disabled companion access", () => {
  it("revokes trip and child-content access while preserving the accepted invitation", async () => {
    const owner = await createTestUser("owner");
    const companion = await createTestUser("companion");
    const tripId = crypto.randomUUID();
    const checklistItemId = crypto.randomUUID();
    const pinId = crypto.randomUUID();

    const { error: tripError } = await owner.client.from("trip").insert({
      id: tripId,
      user_id: owner.id,
      title: "Disabled companion service test trip",
      start_date: "2026-05-01",
      end_date: "2026-05-04",
    });
    expect(tripError).toBeNull();

    const [{ error: checklistItemError }, { error: pinError }] = await Promise.all([
      owner.client.from("checklist_item").insert({
        id: checklistItemId,
        trip_id: tripId,
        user_id: owner.id,
        title: "Owner checklist item",
      }),
      owner.client.from("pin").insert({
        id: pinId,
        trip_id: tripId,
        user_id: owner.id,
        name: "Owner pin",
        start_date: "2026-05-01",
        category_id: "other",
      }),
    ]);
    expect(checklistItemError).toBeNull();
    expect(pinError).toBeNull();

    const { data: invitation, error: invitationError } = await owner.client
      .from("trip_invitation")
      .insert({
        trip_id: tripId,
        inviter_user_id: owner.id,
        invitee_user_id: companion.id,
      })
      .select("id, status")
      .single();
    expect(invitationError).toBeNull();
    expect(invitation).toMatchObject({ status: "pending" });

    const { error: acceptError } = await companion.client
      .from("trip_invitation")
      .update({ status: "accepted" })
      .eq("id", invitation!.id);
    expect(acceptError).toBeNull();

    const [activeTrip, activeChecklistItem, activePin] = await Promise.all([
      companion.client.from("trip").select("id").eq("id", tripId),
      companion.client.from("checklist_item").select("id").eq("id", checklistItemId),
      companion.client.from("pin").select("id").eq("id", pinId),
    ]);
    expect(activeTrip.data).toEqual([{ id: tripId }]);
    expect(activeChecklistItem.data).toEqual([{ id: checklistItemId }]);
    expect(activePin.data).toEqual([{ id: pinId }]);

    const { data: disabledMembership, error: disableError } = await owner.client
      .from("trip_member")
      .update({ status: "disabled", disabled_reason: "owner_disabled" })
      .eq("trip_id", tripId)
      .eq("user_id", companion.id)
      .select("status, disabled_reason")
      .single();
    expect(disableError).toBeNull();
    expect(disabledMembership).toEqual({
      status: "disabled",
      disabled_reason: "owner_disabled",
    });

    const [acceptedInvitation, disabledTrip, disabledChecklistItem, disabledPin] =
      await Promise.all([
        companion.client
          .from("trip_invitation")
          .select("id, status")
          .eq("id", invitation!.id),
        companion.client.from("trip").select("id").eq("id", tripId),
        companion.client.from("checklist_item").select("id").eq("id", checklistItemId),
        companion.client.from("pin").select("id").eq("id", pinId),
      ]);
    expect(acceptedInvitation.error).toBeNull();
    expect(acceptedInvitation.data).toEqual([{ id: invitation!.id, status: "accepted" }]);
    expect(disabledTrip.error).toBeNull();
    expect(disabledTrip.data).toEqual([]);
    expect(disabledChecklistItem.error).toBeNull();
    expect(disabledChecklistItem.data).toEqual([]);
    expect(disabledPin.error).toBeNull();
    expect(disabledPin.data).toEqual([]);
  });
});
