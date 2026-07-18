import { describe, expect, it } from "vitest";

import { createTestUser } from "./local-supabase";

describe("checklist item RLS", () => {
  it("allows active companions to complete shared items, but excludes unrelated users", async () => {
    const owner = await createTestUser("owner");
    const companion = await createTestUser("companion");
    const unrelated = await createTestUser("unrelated");
    const tripId = crypto.randomUUID();
    const checklistItemId = crypto.randomUUID();

    const { error: tripError } = await owner.client.from("trip").insert({
      id: tripId,
      user_id: owner.id,
      title: "Checklist service test trip",
      start_date: "2026-05-01",
      end_date: "2026-05-04",
    });
    expect(tripError).toBeNull();

    const { error: checklistItemError } = await owner.client
      .from("checklist_item")
      .insert({
        id: checklistItemId,
        trip_id: tripId,
        user_id: owner.id,
        title: "Buy flight tickets",
      });
    expect(checklistItemError).toBeNull();

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

    const [companionItem, unrelatedItem] = await Promise.all([
      companion.client
        .from("checklist_item")
        .select("id, completed")
        .eq("id", checklistItemId),
      unrelated.client
        .from("checklist_item")
        .select("id, completed")
        .eq("id", checklistItemId),
    ]);
    expect(companionItem.error).toBeNull();
    expect(companionItem.data).toEqual([{ id: checklistItemId, completed: false }]);
    expect(unrelatedItem.error).toBeNull();
    expect(unrelatedItem.data).toEqual([]);

    const { data: completedItem, error: completeError } = await companion.client
      .from("checklist_item")
      .update({ completed: true })
      .eq("id", checklistItemId)
      .select("id, completed")
      .single();
    expect(completeError).toBeNull();
    expect(completedItem).toEqual({ id: checklistItemId, completed: true });

    const { data: unrelatedUpdate, error: unrelatedUpdateError } = await unrelated.client
      .from("checklist_item")
      .update({ completed: false })
      .eq("id", checklistItemId)
      .select("id, completed");
    expect(unrelatedUpdateError).toBeNull();
    expect(unrelatedUpdate).toEqual([]);
  });
});
