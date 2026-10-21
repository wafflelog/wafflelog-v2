import { describe, expect, it } from "vitest";

import { createTestUser } from "./local-supabase";

describe("companion leave and re-invitation", () => {
  it("retains trip content, revokes access, and restores access after a new invitation", async () => {
    const owner = await createTestUser("owner");
    const companion = await createTestUser("companion");
    const tripId = crypto.randomUUID();
    const noteId = crypto.randomUUID();
    const pinId = crypto.randomUUID();

    const { error: tripError } = await owner.client.from("trip").insert({
      id: tripId,
      user_id: owner.id,
      title: "Companion leave service test trip",
      start_date: "2026-05-01",
      end_date: "2026-05-04",
    });
    expect(tripError).toBeNull();

    const { data: firstInvitation, error: firstInvitationError } =
      await owner.client
        .from("trip_invitation")
        .insert({
          trip_id: tripId,
          inviter_user_id: owner.id,
          invitee_user_id: companion.id,
        })
        .select("id")
        .single();
    expect(firstInvitationError).toBeNull();

    const { error: firstAcceptanceError } = await companion.client
      .from("trip_invitation")
      .update({ status: "accepted" })
      .eq("id", firstInvitation!.id);
    expect(firstAcceptanceError).toBeNull();

    const { error: activeReinviteError } = await owner.client
      .from("trip_invitation")
      .insert({
        trip_id: tripId,
        inviter_user_id: owner.id,
        invitee_user_id: companion.id,
      });
    expect(activeReinviteError).not.toBeNull();

    const { error: noteError } = await companion.client.from("note").insert({
      id: noteId,
      trip_id: tripId,
      pin_id: null,
      user_id: companion.id,
      text: "Keep this note after I leave",
    });
    expect(noteError).toBeNull();

    const { error: pinError } = await companion.client.from("pin").insert({
      id: pinId,
      trip_id: tripId,
      user_id: companion.id,
      name: "Companion place",
      start_date: "2026-05-02",
      category_id: "place",
    });
    expect(pinError).toBeNull();

    const { error: leaveError } = await companion.client
      .from("trip_member")
      .update({
        status: "disabled",
        disabled_reason: "user_left",
        updated_at: new Date().toISOString(),
      })
      .eq("trip_id", tripId)
      .eq("user_id", companion.id)
      .eq("status", "active");
    expect(leaveError).toBeNull();

    const { data: leftMembership, error: leftMembershipError } =
      await owner.client
        .from("trip_member")
        .select("status, disabled_reason")
        .eq("trip_id", tripId)
        .eq("user_id", companion.id)
        .single();
    expect(leftMembershipError).toBeNull();
    expect(leftMembership).toEqual({
      status: "disabled",
      disabled_reason: "user_left",
    });

    const { data: ownDisabledMembership, error: ownMembershipError } =
      await companion.client
        .from("trip_member")
        .select("user_id, status, disabled_reason")
        .eq("trip_id", tripId);
    expect(ownMembershipError).toBeNull();
    expect(ownDisabledMembership).toEqual([
      {
        user_id: companion.id,
        status: "disabled",
        disabled_reason: "user_left",
      },
    ]);

    const { error: ownerRestoreWithoutInviteError } = await owner.client
      .from("trip_member")
      .update({
        status: "active",
        disabled_reason: null,
        updated_at: new Date().toISOString(),
      })
      .eq("trip_id", tripId)
      .eq("user_id", companion.id);
    expect(ownerRestoreWithoutInviteError).not.toBeNull();

    const { error: selfRestoreError } = await companion.client
      .from("trip_member")
      .update({
        status: "active",
        disabled_reason: null,
        updated_at: new Date().toISOString(),
      })
      .eq("trip_id", tripId)
      .eq("user_id", companion.id);
    expect(selfRestoreError).toBeNull();

    const { data: membershipAfterSelfRestore } = await owner.client
      .from("trip_member")
      .select("status, disabled_reason")
      .eq("trip_id", tripId)
      .eq("user_id", companion.id)
      .single();
    expect(membershipAfterSelfRestore).toEqual({
      status: "disabled",
      disabled_reason: "user_left",
    });

    const [companionTrip, retainedNote] = await Promise.all([
      companion.client.from("trip").select("id").eq("id", tripId),
      owner.client.from("note").select("id, text").eq("id", noteId),
    ]);
    expect(companionTrip.error).toBeNull();
    expect(companionTrip.data).toEqual([]);
    expect(retainedNote.error).toBeNull();
    expect(retainedNote.data).toEqual([
      { id: noteId, text: "Keep this note after I leave" },
    ]);

    const { data: ownerEditedPin, error: ownerEditPinError } =
      await owner.client
        .from("pin")
        .update({ name: "Owner updated place" })
        .eq("id", pinId)
        .select("name, user_id")
        .single();
    expect(ownerEditPinError).toBeNull();
    expect(ownerEditedPin).toEqual({
      name: "Owner updated place",
      user_id: companion.id,
    });

    const { data: secondInvitation, error: secondInvitationError } =
      await owner.client
        .from("trip_invitation")
        .insert({
          trip_id: tripId,
          inviter_user_id: owner.id,
          invitee_user_id: companion.id,
        })
        .select("id")
        .single();
    expect(secondInvitationError).toBeNull();
    expect(secondInvitation?.id).not.toBe(firstInvitation?.id);

    const { error: secondAcceptanceError } = await companion.client
      .from("trip_invitation")
      .update({ status: "accepted" })
      .eq("id", secondInvitation!.id);
    expect(secondAcceptanceError).toBeNull();

    const [restoredMembership, restoredTrip, restoredNote] = await Promise.all([
      companion.client
        .from("trip_member")
        .select("status, disabled_reason, created_from_invitation_id")
        .eq("trip_id", tripId)
        .eq("user_id", companion.id)
        .single(),
      companion.client.from("trip").select("id").eq("id", tripId),
      companion.client.from("note").select("id").eq("id", noteId),
    ]);
    expect(restoredMembership.error).toBeNull();
    expect(restoredMembership.data).toEqual({
      status: "active",
      disabled_reason: null,
      created_from_invitation_id: secondInvitation!.id,
    });
    expect(restoredTrip.error).toBeNull();
    expect(restoredTrip.data).toEqual([{ id: tripId }]);
    expect(restoredNote.error).toBeNull();
    expect(restoredNote.data).toEqual([{ id: noteId }]);
  });
});
