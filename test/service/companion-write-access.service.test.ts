import { describe, expect, it } from "vitest";

import { createTestUser } from "./local-supabase";

describe("companion write access", () => {
  it("allows active companions to create and complete content, then denies reads and writes after disablement", async () => {
    const owner = await createTestUser("owner");
    const companion = await createTestUser("companion");
    const tripId = crypto.randomUUID();
    const ownerChecklistItemId = crypto.randomUUID();
    const companionChecklistItemId = crypto.randomUUID();
    const companionPinId = crypto.randomUUID();

    const { error: tripError } = await owner.client.from("trip").insert({
      id: tripId,
      user_id: owner.id,
      title: "Companion write service test trip",
      start_date: "2026-05-01",
      end_date: "2026-05-04",
    });
    expect(tripError).toBeNull();

    const { error: ownerChecklistItemError } = await owner.client
      .from("checklist_item")
      .insert({
        id: ownerChecklistItemId,
        trip_id: tripId,
        user_id: owner.id,
        title: "Shared owner checklist item",
      });
    expect(ownerChecklistItemError).toBeNull();

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

    const [companionChecklistItem, companionPin, completedOwnerItem] = await Promise.all([
      companion.client
        .from("checklist_item")
        .insert({
          id: companionChecklistItemId,
          trip_id: tripId,
          user_id: companion.id,
          title: "Companion checklist item",
        })
        .select("id, user_id")
        .single(),
      companion.client
        .from("pin")
        .insert({
          id: companionPinId,
          trip_id: tripId,
          user_id: companion.id,
          name: "Companion pin",
          start_date: "2026-05-01",
          category_id: "other",
        })
        .select("id, user_id")
        .single(),
      companion.client
        .from("checklist_item")
        .update({ completed: true })
        .eq("id", ownerChecklistItemId)
        .select("id, completed")
        .single(),
    ]);
    expect(companionChecklistItem.error).toBeNull();
    expect(companionChecklistItem.data).toEqual({
      id: companionChecklistItemId,
      user_id: companion.id,
    });
    expect(companionPin.error).toBeNull();
    expect(companionPin.data).toEqual({ id: companionPinId, user_id: companion.id });
    expect(completedOwnerItem.error).toBeNull();
    expect(completedOwnerItem.data).toEqual({ id: ownerChecklistItemId, completed: true });

    const { error: disableError } = await owner.client
      .from("trip_member")
      .update({ status: "disabled", disabled_reason: "owner_disabled" })
      .eq("trip_id", tripId)
      .eq("user_id", companion.id);
    expect(disableError).toBeNull();

    const [readAfterDisable, checklistInsertAfterDisable, pinInsertAfterDisable, checklistUpdateAfterDisable, pinUpdateAfterDisable] =
      await Promise.all([
        companion.client.from("checklist_item").select("id").eq("id", ownerChecklistItemId),
        companion.client.from("checklist_item").insert({
          id: crypto.randomUUID(),
          trip_id: tripId,
          user_id: companion.id,
          title: "Disabled companion checklist item",
        }),
        companion.client.from("pin").insert({
          trip_id: tripId,
          user_id: companion.id,
          name: "Disabled companion pin",
          start_date: "2026-05-01",
          category_id: "other",
        }),
        companion.client
          .from("checklist_item")
          .update({ completed: false })
          .eq("id", companionChecklistItemId)
          .select("id"),
        companion.client
          .from("pin")
          .update({ name: "Disabled companion pin update" })
          .eq("id", companionPinId)
          .select("id"),
      ]);
    expect(readAfterDisable.error).toBeNull();
    expect(readAfterDisable.data).toEqual([]);
    expect(checklistInsertAfterDisable.error).not.toBeNull();
    expect(pinInsertAfterDisable.error).not.toBeNull();
    expect(checklistUpdateAfterDisable.error).toBeNull();
    expect(checklistUpdateAfterDisable.data).toEqual([]);
    expect(pinUpdateAfterDisable.error).toBeNull();
    expect(pinUpdateAfterDisable.data).toEqual([]);
  });
});
