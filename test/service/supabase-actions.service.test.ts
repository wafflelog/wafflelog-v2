import { describe, expect, it, vi } from "vitest";

import {
  actionAcceptTripInvitation,
  actionCreateTrip,
  actionCreateTripInvitation,
  actionDisableCompanionAccess,
  actionGetRemotePinById,
  actionGetRemoteTripById,
  actionGetRemoteTripSyncBundle,
  actionListActiveCompanionMemberships,
  actionListAppNotifications,
  actionListPublicUsers,
  actionListTripCompanions,
  actionListTripInvitationsByTrip,
  actionMarkNotificationRead,
  actionRejectTripInvitation,
  actionRestoreCompanionAccess,
  actionSignInWithEmail,
  actionSignUpWithEmail,
  actionSoftDeleteRemoteChecklistItem,
  actionSoftDeleteRemoteDocument,
  actionSoftDeleteRemoteExpense,
  actionSoftDeleteRemoteImage,
  actionSoftDeleteRemoteNote,
  actionSoftDeleteRemotePin,
  actionSoftDeleteRemoteReferenceLink,
  actionSoftDeleteRemoteTrip,
  actionUpdateRemoteChecklistItemFromLocal,
  actionUpsertRemoteChecklistItemFromLocal,
  actionUpsertRemoteDocumentFromLocal,
  actionUpsertRemoteExpenseFromLocal,
  actionUpsertRemoteImageFromLocal,
  actionUpsertRemoteNoteFromLocal,
  actionUpsertRemotePinFromLocal,
  actionUpsertRemoteReferenceLinkFromLocal,
  actionUpsertRemoteTripFromLocal,
  actionWithdrawTripInvitation,
} from "@/lib/supabase/actions";

import { createPublicClient, createTestUser } from "./local-supabase";

vi.mock("expo-secure-store", () => ({
  deleteItemAsync: vi.fn(),
  getItemAsync: vi.fn(),
  setItemAsync: vi.fn(),
}));

describe("Supabase actions", () => {
  it("maps trip and checklist inputs through the real authenticated Supabase client", async () => {
    const owner = await createTestUser("owner");
    const tripId = crypto.randomUUID();
    const checklistItemId = crypto.randomUUID();

    const trip = await actionCreateTrip(
      {
        id: tripId,
        title: "  Action-created trip  ",
        startDate: "2026-05-01",
        endDate: "2026-05-04",
      },
      owner.client,
    );
    expect(trip).toMatchObject({
      id: tripId,
      title: "Action-created trip",
      startDate: "2026-05-01",
      endDate: "2026-05-04",
      deletedAt: null,
    });

    const checklistItem = await actionUpsertRemoteChecklistItemFromLocal(
      {
        id: checklistItemId,
        tripId,
        title: "  Action-created checklist item  ",
        completed: false,
      },
      owner.client,
    );
    expect(checklistItem).toMatchObject({
      id: checklistItemId,
      tripId,
      userId: owner.id,
      title: "Action-created checklist item",
      completed: false,
      deletedAt: null,
    });

    const updatedChecklistItem = await actionUpdateRemoteChecklistItemFromLocal(
      {
        id: checklistItemId,
        tripId,
        title: "  Completed by action  ",
        completed: true,
      },
      owner.client,
    );
    expect(updatedChecklistItem).toMatchObject({
      id: checklistItemId,
      tripId,
      userId: owner.id,
      title: "Completed by action",
      completed: true,
      deletedAt: null,
    });

    const { data: persistedItem, error: persistedItemError } =
      await owner.client
        .from("checklist_item")
        .select("title, completed")
        .eq("id", checklistItemId)
        .single();
    expect(persistedItemError).toBeNull();
    expect(persistedItem).toEqual({
      title: "Completed by action",
      completed: true,
    });
  });

  it("maps trip, pin, and delete actions through an injected client", async () => {
    const owner = await createTestUser("action_owner");
    const tripId = crypto.randomUUID();
    const pinId = crypto.randomUUID();

    const trip = await actionUpsertRemoteTripFromLocal(
      {
        id: tripId,
        title: "  Offline trip  ",
        startDate: "2026-08-01",
        endDate: "2026-08-03",
      },
      owner.client,
    );
    expect(trip).toMatchObject({ id: tripId, title: "Offline trip" });
    expect(await actionGetRemoteTripById(tripId, owner.client)).toMatchObject(
      trip,
    );

    const pin = await actionUpsertRemotePinFromLocal(
      {
        id: pinId,
        tripId,
        name: "  Hotel  ",
        startDate: "2026-08-01",
        endDate: null,
        time: " 12:00 ",
        endTime: null,
        categoryId: "accommodation",
        metadataJson: { version: 1, destination: "Lisbon" },
      },
      owner.client,
    );
    expect(pin).toMatchObject({
      id: pinId,
      tripId,
      userId: owner.id,
      name: "Hotel",
      time: "12:00",
      metadataJson: { version: 1, destination: "Lisbon" },
    });
    expect(await actionGetRemotePinById(pinId, owner.client)).toMatchObject(
      pin,
    );

    await actionSoftDeleteRemotePin(pinId, owner.client);
    await actionSoftDeleteRemoteTrip(tripId, owner.client);
    const { data, error } = await owner.client
      .from("trip")
      .select("deleted_at, pin(deleted_at)")
      .eq("id", tripId)
      .single();
    expect(error).toBeNull();
    expect(data?.deleted_at).not.toBeNull();
    expect(data?.pin[0]?.deleted_at).not.toBeNull();
  });

  it("maps child-content actions and soft deletes through an injected client", async () => {
    const owner = await createTestUser("content_owner");
    const tripId = crypto.randomUUID();
    const pinId = crypto.randomUUID();
    await actionCreateTrip(
      {
        id: tripId,
        title: "Content trip",
        startDate: "2026-09-01",
        endDate: "2026-09-02",
      },
      owner.client,
    );
    await actionUpsertRemotePinFromLocal(
      {
        id: pinId,
        tripId,
        name: null,
        startDate: "2026-09-01",
        endDate: null,
        time: null,
        endTime: null,
        categoryId: "other",
        metadataJson: { version: 1 },
      },
      owner.client,
    );

    const note = await actionUpsertRemoteNoteFromLocal(
      { id: crypto.randomUUID(), tripId, pinId, text: "  Remember tickets  " },
      owner.client,
    );
    const link = await actionUpsertRemoteReferenceLinkFromLocal(
      {
        id: crypto.randomUUID(),
        tripId,
        pinId,
        title: "Guide",
        url: " https://example.com ",
        caption: "Read",
      },
      owner.client,
    );
    const expense = await actionUpsertRemoteExpenseFromLocal(
      {
        id: crypto.randomUUID(),
        tripId,
        pinId,
        description: "  Train  ",
        amount: 19.5,
        currency: " eur ",
        paidByUserId: owner.id,
        paidByName: "  Owner  ",
      },
      owner.client,
    );
    const document = await actionUpsertRemoteDocumentFromLocal(
      {
        id: crypto.randomUUID(),
        tripId,
        pinId,
        fileName: "  ticket.pdf ",
        mimeType: " application/pdf ",
        storageBucket: " travel-documents ",
        storagePath: " trip/file.pdf ",
        caption: "Ticket",
      },
      owner.client,
    );
    const image = await actionUpsertRemoteImageFromLocal(
      {
        id: crypto.randomUUID(),
        tripId,
        pinId,
        storageBucket: " images ",
        storagePath: " trip/photo.jpg ",
        mimeType: " image/jpeg ",
        width: 1200,
        height: 800,
        caption: "View",
      },
      owner.client,
    );
    expect(note).toMatchObject({ text: "Remember tickets", userId: owner.id });
    expect(link).toMatchObject({ url: "https://example.com", tripId });
    expect(expense).toMatchObject({
      description: "Train",
      currency: "eur",
      paidByName: "Owner",
    });
    expect(document).toMatchObject({
      fileName: "ticket.pdf",
      storageBucket: "travel-documents",
    });
    expect(image).toMatchObject({
      storageBucket: "images",
      width: 1200,
      height: 800,
    });

    await actionSoftDeleteRemoteChecklistItem(
      (
        await actionUpsertRemoteChecklistItemFromLocal(
          {
            id: crypto.randomUUID(),
            tripId,
            title: "Delete me",
            completed: false,
          },
          owner.client,
        )
      ).id,
      owner.client,
    );
    await Promise.all([
      actionSoftDeleteRemoteNote(note.id, owner.client),
      actionSoftDeleteRemoteReferenceLink(link.id, owner.client),
      actionSoftDeleteRemoteExpense(expense.id, owner.client),
      actionSoftDeleteRemoteDocument(document.id, owner.client),
      actionSoftDeleteRemoteImage(image.id, owner.client),
    ]);
    const { data, error } = await owner.client
      .from("note")
      .select("deleted_at")
      .eq("id", note.id)
      .single();
    expect(error).toBeNull();
    expect(data?.deleted_at).not.toBeNull();
  });

  it("maps invitation, companion, and notification actions through injected clients", async () => {
    const owner = await createTestUser("companion_owner");
    const invitee = await createTestUser("companion_invitee");
    const rejectedInvitee = await createTestUser("companion_reject");
    const withdrawnInvitee = await createTestUser("companion_wd");
    const tripId = crypto.randomUUID();
    await actionCreateTrip(
      {
        id: tripId,
        title: "Shared trip",
        startDate: "2026-10-01",
        endDate: "2026-10-04",
      },
      owner.client,
    );

    const invitation = await actionCreateTripInvitation(
      { tripId, inviteeUserId: invitee.id },
      owner.client,
    );
    expect(invitation).toMatchObject({
      trip_id: tripId,
      invitee_user_id: invitee.id,
      status: "pending",
    });
    expect(
      await actionListTripInvitationsByTrip(tripId, owner.client),
    ).toContainEqual(
      expect.objectContaining({
        id: invitation.id,
        fullname: expect.stringContaining("companion_invitee"),
        state: "INVITED",
      }),
    );
    expect(await actionListTripCompanions(tripId, owner.client)).toContainEqual(
      expect.objectContaining({
        userId: invitee.id,
        state: "INVITED",
        tripInvitationId: invitation.id,
      }),
    );

    const accepted = await actionAcceptTripInvitation(
      invitation.id,
      invitee.client,
    );
    expect(accepted.status).toBe("accepted");
    const memberships = await actionListActiveCompanionMemberships(
      invitee.client,
    );
    expect(memberships).toContainEqual(
      expect.objectContaining({ tripId, userId: invitee.id, status: "active" }),
    );
    const companion = (
      await actionListTripCompanions(tripId, owner.client)
    ).find((item) => item.userId === invitee.id);
    expect(companion).toMatchObject({
      state: "ACCEPTED",
      tripMemberId: expect.any(String),
    });

    const disabled = await actionDisableCompanionAccess(
      companion!.tripMemberId!,
      owner.client,
    );
    expect(disabled.status).toBe("disabled");
    const restored = await actionRestoreCompanionAccess(
      companion!.tripMemberId!,
      owner.client,
    );
    expect(restored.status).toBe("active");

    const rejectedInvitation = await actionCreateTripInvitation(
      { tripId, inviteeUserId: rejectedInvitee.id },
      owner.client,
    );
    expect(
      (
        await actionRejectTripInvitation(
          rejectedInvitation.id,
          rejectedInvitee.client,
        )
      ).status,
    ).toBe("rejected");
    const withdrawnInvitation = await actionCreateTripInvitation(
      { tripId, inviteeUserId: withdrawnInvitee.id },
      owner.client,
    );
    expect(
      (await actionWithdrawTripInvitation(withdrawnInvitation.id, owner.client))
        .status,
    ).toBe("withdrawn");

    const notifications = await actionListAppNotifications(invitee.client);
    const invitationNotification = notifications.find(
      (notification) => notification.trip_invitation_id === invitation.id,
    );
    expect(invitationNotification).toMatchObject({
      invitationStatus: "accepted",
    });
    const readNotification = await actionMarkNotificationRead(
      invitationNotification!.id,
      invitee.client,
    );
    expect(readNotification.read_at).not.toBeNull();
  });

  it("maps authentication, public-user, and sync-bundle action outputs", async () => {
    const publicClient = createPublicClient();
    const suffix = crypto.randomUUID().replaceAll("-", "").slice(0, 12);
    const email = `action_signup_${suffix}@service-test.local`;
    const username = `action_signup_${suffix}`;
    const signUp = await actionSignUpWithEmail(
      {
        email: `  ${email}  `,
        password: "service-test-password",
        username: `  ${username}  `,
      },
      publicClient,
    );
    expect(signUp.user?.email).toBe(email);
    const signIn = await actionSignInWithEmail(
      { email: `  ${email}  `, password: "service-test-password" },
      createPublicClient(),
    );
    expect(signIn.user?.email).toBe(email);

    const owner = await createTestUser("bundle_owner");
    const tripId = crypto.randomUUID();
    const pinId = crypto.randomUUID();
    await actionCreateTrip(
      {
        id: tripId,
        title: "Bundle trip",
        startDate: "2026-11-01",
        endDate: "2026-11-03",
      },
      owner.client,
    );
    await actionUpsertRemotePinFromLocal(
      {
        id: pinId,
        tripId,
        name: "Bundle pin",
        startDate: "2026-11-01",
        endDate: null,
        time: null,
        endTime: null,
        categoryId: "other",
        metadataJson: { version: 1 },
      },
      owner.client,
    );
    await actionUpsertRemoteChecklistItemFromLocal(
      {
        id: crypto.randomUUID(),
        tripId,
        title: "Bundle item",
        completed: false,
      },
      owner.client,
    );
    await actionUpsertRemoteNoteFromLocal(
      { id: crypto.randomUUID(), tripId, pinId, text: "Bundle note" },
      owner.client,
    );
    await actionUpsertRemoteReferenceLinkFromLocal(
      {
        id: crypto.randomUUID(),
        tripId,
        pinId,
        title: null,
        url: "https://example.com/bundle",
        caption: null,
      },
      owner.client,
    );
    await actionUpsertRemoteExpenseFromLocal(
      {
        id: crypto.randomUUID(),
        tripId,
        pinId,
        description: "Bundle expense",
        amount: 42,
        currency: "GBP",
        paidByUserId: owner.id,
        paidByName: "Bundle owner",
      },
      owner.client,
    );
    await actionUpsertRemoteDocumentFromLocal(
      {
        id: crypto.randomUUID(),
        tripId,
        pinId,
        fileName: "bundle.pdf",
        mimeType: "application/pdf",
        storageBucket: "travel-documents",
        storagePath: "trip/bundle.pdf",
        caption: null,
      },
      owner.client,
    );
    await actionUpsertRemoteImageFromLocal(
      {
        id: crypto.randomUUID(),
        tripId,
        pinId,
        storageBucket: "images",
        storagePath: "trip/bundle.jpg",
        mimeType: "image/jpeg",
        width: 10,
        height: 20,
        caption: null,
      },
      owner.client,
    );

    const users = await actionListPublicUsers("bundle_owner", owner.client);
    expect(users).toContainEqual(expect.objectContaining({ id: owner.id }));
    const bundle = await actionGetRemoteTripSyncBundle(tripId, owner.client);
    expect(bundle).toMatchObject({
      trip: { id: tripId, title: "Bundle trip" },
    });
    expect(bundle.pins).toHaveLength(1);
    expect(bundle.checklistItems).toHaveLength(1);
    expect(bundle.notes).toHaveLength(1);
    expect(bundle.referenceLinks).toHaveLength(1);
    expect(bundle.expenses).toHaveLength(1);
    expect(bundle.documents).toHaveLength(1);
    expect(bundle.images).toHaveLength(1);
    expect(bundle.userProfiles).toContainEqual(
      expect.objectContaining({ id: owner.id }),
    );
  });
});
