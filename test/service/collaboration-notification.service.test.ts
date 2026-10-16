import { describe, expect, it } from "vitest";

import { createTestUser } from "./local-supabase";

async function acceptTripInvitation(
  owner: Awaited<ReturnType<typeof createTestUser>>,
  companion: Awaited<ReturnType<typeof createTestUser>>,
  tripId: string,
) {
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
}

describe("collaboration notifications", () => {
  it("notifies the owner about a companion's new expense and note", async () => {
    const owner = await createTestUser("owner");
    const companion = await createTestUser("companion");
    const disabledCompanion = await createTestUser("disabled");
    const unrelated = await createTestUser("unrelated");
    const tripId = crypto.randomUUID();

    const { error: tripError } = await owner.client.from("trip").insert({
      id: tripId,
      user_id: owner.id,
      title: "Lisbon weekend",
      start_date: "2026-11-06",
      end_date: "2026-11-08",
    });
    expect(tripError).toBeNull();

    await acceptTripInvitation(owner, companion, tripId);
    await acceptTripInvitation(owner, disabledCompanion, tripId);

    const { error: disableError } = await owner.client
      .from("trip_member")
      .update({ status: "disabled", disabled_reason: "owner_disabled" })
      .eq("trip_id", tripId)
      .eq("user_id", disabledCompanion.id);
    expect(disableError).toBeNull();

    const [{ error: expenseError }, { error: noteError }] = await Promise.all([
      companion.client.from("expense").insert({
        id: crypto.randomUUID(),
        trip_id: tripId,
        user_id: companion.id,
        description: "Dinner",
        amount: 42.8,
        currency: "GBP",
        paid_by_user_id: companion.id,
        paid_by_name: "Companion",
      }),
      companion.client.from("note").insert({
        id: crypto.randomUUID(),
        trip_id: tripId,
        user_id: companion.id,
        text: "Book the restaurant terrace.",
      }),
    ]);
    expect(expenseError).toBeNull();
    expect(noteError).toBeNull();

    const notificationTypes = ["expense_added", "note_added"];
    const [
      ownerNotifications,
      actorNotifications,
      disabledNotifications,
      unrelatedNotifications,
    ] = await Promise.all([
      owner.client
        .from("app_notification")
        .select("actor_user_id, trip_id, type, title, body")
        .eq("trip_id", tripId)
        .in("type", notificationTypes),
      companion.client
        .from("app_notification")
        .select("id")
        .eq("trip_id", tripId)
        .in("type", notificationTypes),
      disabledCompanion.client
        .from("app_notification")
        .select("id")
        .eq("trip_id", tripId)
        .in("type", notificationTypes),
      unrelated.client
        .from("app_notification")
        .select("id")
        .eq("trip_id", tripId)
        .in("type", notificationTypes),
    ]);

    expect(ownerNotifications.error).toBeNull();
    expect(ownerNotifications.data).toEqual(
      expect.arrayContaining([
        {
          actor_user_id: companion.id,
          trip_id: tripId,
          type: "expense_added",
          title: "Expense added",
          body: expect.stringContaining("added an expense to Lisbon weekend"),
        },
        {
          actor_user_id: companion.id,
          trip_id: tripId,
          type: "note_added",
          title: "New trip note",
          body: expect.stringContaining("added a note to Lisbon weekend"),
        },
      ]),
    );
    expect(ownerNotifications.data).toHaveLength(2);

    for (const result of [
      actorNotifications,
      disabledNotifications,
      unrelatedNotifications,
    ]) {
      expect(result.error).toBeNull();
      expect(result.data).toEqual([]);
    }
  });

  it("notifies active companions only when meaningful trip details change", async () => {
    const owner = await createTestUser("owner");
    const companion = await createTestUser("companion");
    const tripId = crypto.randomUUID();

    const { error: tripError } = await owner.client.from("trip").insert({
      id: tripId,
      user_id: owner.id,
      title: "Lisbon weekend",
      start_date: "2026-11-06",
      end_date: "2026-11-08",
    });
    expect(tripError).toBeNull();

    await acceptTripInvitation(owner, companion, tripId);

    const { error: unchangedUpdateError } = await owner.client
      .from("trip")
      .update({ title: "Lisbon weekend" })
      .eq("id", tripId);
    expect(unchangedUpdateError).toBeNull();

    const { data: unchangedNotifications, error: unchangedNotificationError } =
      await companion.client
        .from("app_notification")
        .select("id")
        .eq("trip_id", tripId)
        .eq("type", "trip_updated");
    expect(unchangedNotificationError).toBeNull();
    expect(unchangedNotifications).toEqual([]);

    const { error: dateUpdateError } = await owner.client
      .from("trip")
      .update({
        start_date: "2026-11-07",
        end_date: "2026-11-09",
      })
      .eq("id", tripId);
    expect(dateUpdateError).toBeNull();

    const { error: titleUpdateError } = await owner.client
      .from("trip")
      .update({ title: "Long weekend in Lisbon" })
      .eq("id", tripId);
    expect(titleUpdateError).toBeNull();

    const [companionNotifications, ownerNotifications] = await Promise.all([
      companion.client
        .from("app_notification")
        .select("actor_user_id, trip_id, type, title, body")
        .eq("trip_id", tripId)
        .eq("type", "trip_updated")
        .order("created_at", { ascending: true }),
      owner.client
        .from("app_notification")
        .select("id")
        .eq("trip_id", tripId)
        .eq("type", "trip_updated"),
    ]);

    expect(companionNotifications.error).toBeNull();
    expect(companionNotifications.data).toEqual(
      expect.arrayContaining([
        {
          actor_user_id: owner.id,
          trip_id: tripId,
          type: "trip_updated",
          title: "Trip updated",
          body: expect.stringContaining("changed the dates for Lisbon weekend"),
        },
        {
          actor_user_id: owner.id,
          trip_id: tripId,
          type: "trip_updated",
          title: "Trip updated",
          body: expect.stringContaining(
            "renamed Lisbon weekend to Long weekend in Lisbon",
          ),
        },
      ]),
    );
    expect(companionNotifications.data).toHaveLength(2);
    expect(ownerNotifications.error).toBeNull();
    expect(ownerNotifications.data).toEqual([]);
  });
});
