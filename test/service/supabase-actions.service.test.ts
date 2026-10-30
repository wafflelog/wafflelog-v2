import { describe, expect, it, vi } from "vitest";

import {
  actionAcceptTripInvitation,
  actionCreateTrip,
  actionCreateTripInvitation,
  actionDisableCompanionAccess,
  actionGetRemotePinById,
  actionGetRemoteTripById,
  actionGetRemoteTripSyncBundle,
  actionLeaveTrip,
  actionListActiveCompanionMemberships,
  actionListAppNotifications,
  actionListCompanionMemberships,
  actionListPublicUsers,
  actionListRemoteOwnedTripIds,
  actionListTripCompanions,
  actionListTripInvitationsByTrip,
  actionMarkNotificationsRead,
  actionRejectTripInvitation,
  actionRemovePushDevice,
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
  actionUpsertPushDevice,
  actionUpsertRemoteChecklistItemFromLocal,
  actionUpsertRemoteDocumentFromLocal,
  actionUpsertRemoteExpenseFromLocal,
  actionUpsertRemoteImageFromLocal,
  actionUpsertRemoteNoteFromLocal,
  actionUpsertRemotePinFromLocal,
  actionUpsertRemotePinLocationFromLocal,
  actionUpsertRemoteReferenceLinkFromLocal,
  actionUpsertRemoteTripFromLocal,
  actionWithdrawTripInvitation,
} from "@/lib/supabase/actions";

import {
  adminClient,
  createPublicClient,
  createTestUser,
} from "./local-supabase";

vi.mock("expo-secure-store", () => ({
  deleteItemAsync: vi.fn(),
  getItemAsync: vi.fn(),
  setItemAsync: vi.fn(),
}));

describe("Supabase actions", () => {
  it("upserts one push-device row for the same Expo token", async () => {
    const user = await createTestUser("push");
    const expoPushToken = `ExpoPushToken[${crypto.randomUUID()}]`;

    const firstRegistration = await actionUpsertPushDevice(
      { expoPushToken, platform: "ios" },
      user.client,
    );
    const secondRegistration = await actionUpsertPushDevice(
      { expoPushToken, platform: "ios" },
      user.client,
    );

    expect(secondRegistration).toBe(firstRegistration);

    const { data: storedDevices, error } = await user.client
      .from("user_push_device")
      .select("user_id, expo_push_token, platform")
      .eq("expo_push_token", expoPushToken);

    expect(error).toBeNull();
    expect(storedDevices).toEqual([
      {
        user_id: user.id,
        expo_push_token: expoPushToken,
        platform: "ios",
      },
    ]);
  });

  it("transfers one Expo token to the currently authenticated user", async () => {
    const firstUser = await createTestUser("push_a");
    const secondUser = await createTestUser("push_b");
    const expoPushToken = `ExpoPushToken[${crypto.randomUUID()}]`;

    const firstDeviceId = await actionUpsertPushDevice(
      { expoPushToken, platform: "ios" },
      firstUser.client,
    );
    const claimedDeviceId = await actionUpsertPushDevice(
      { expoPushToken, platform: "ios" },
      secondUser.client,
    );

    expect(claimedDeviceId).toBe(firstDeviceId);

    const { data: storedDevices, error } = await adminClient
      .from("user_push_device")
      .select("user_id, expo_push_token")
      .eq("expo_push_token", expoPushToken);

    expect(error).toBeNull();
    expect(storedDevices).toEqual([
      {
        user_id: secondUser.id,
        expo_push_token: expoPushToken,
      },
    ]);
  });

  it("keeps separate device tokens for the same user", async () => {
    const user = await createTestUser("push_multi");
    const firstToken = `ExpoPushToken[${crypto.randomUUID()}]`;
    const secondToken = `ExpoPushToken[${crypto.randomUUID()}]`;

    await actionUpsertPushDevice(
      { expoPushToken: firstToken, platform: "ios" },
      user.client,
    );
    await actionUpsertPushDevice(
      { expoPushToken: secondToken, platform: "android" },
      user.client,
    );

    const { data: storedDevices, error } = await user.client
      .from("user_push_device")
      .select("expo_push_token, platform")
      .in("expo_push_token", [firstToken, secondToken])
      .order("platform");

    expect(error).toBeNull();
    expect(storedDevices).toEqual([
      { expo_push_token: secondToken, platform: "android" },
      { expo_push_token: firstToken, platform: "ios" },
    ]);
  });

  it("rejects push-device claims from anonymous callers", async () => {
    const publicClient = createPublicClient();
    const { data, error } = await publicClient.rpc("claim_push_device", {
      p_expo_push_token: `ExpoPushToken[${crypto.randomUUID()}]`,
      p_platform: "ios",
    });

    expect(data).toBeNull();
    expect(error).not.toBeNull();
  });

  it("does not let another user remove a claimed push device", async () => {
    const owner = await createTestUser("push_owner");
    const otherUser = await createTestUser("push_other");
    const expoPushToken = `ExpoPushToken[${crypto.randomUUID()}]`;

    await actionUpsertPushDevice(
      { expoPushToken, platform: "ios" },
      owner.client,
    );
    await actionRemovePushDevice(expoPushToken, otherUser.client);

    const { data: storedDevices, error } = await adminClient
      .from("user_push_device")
      .select("user_id")
      .eq("expo_push_token", expoPushToken);

    expect(error).toBeNull();
    expect(storedDevices).toEqual([{ user_id: owner.id }]);
  });

  it("removes only the signed-in user's matching push device", async () => {
    const user = await createTestUser("push_remove");
    const expoPushToken = `ExpoPushToken[${crypto.randomUUID()}]`;

    await actionUpsertPushDevice(
      { expoPushToken, platform: "ios" },
      user.client,
    );
    await actionRemovePushDevice(expoPushToken, user.client);

    const { data: storedDevices, error } = await adminClient
      .from("user_push_device")
      .select("id")
      .eq("expo_push_token", expoPushToken);

    expect(error).toBeNull();
    expect(storedDevices).toEqual([]);
  });

  it("syncs expense allocations atomically", async () => {
    const owner = await createTestUser("shared_expense");
    const tripId = crypto.randomUUID();
    const validExpenseId = crypto.randomUUID();
    const invalidExpenseId = crypto.randomUUID();

    await actionCreateTrip(
      {
        id: tripId,
        title: "Shared expense action trip",
        startDate: "2026-05-01",
        endDate: "2026-05-04",
      },
      owner.client,
    );

    await actionUpsertRemoteExpenseFromLocal(
      {
        id: validExpenseId,
        tripId,
        pinId: null,
        description: "Dinner",
        amount: 12.5,
        currency: "GBP",
        paidByUserId: owner.id,
        paidByName: "Owner",
        participants: [{ userId: owner.id, splitAmount: 12.5 }],
      },
      owner.client,
    );

    await expect(
      owner.client
        .from("expense_participant")
        .select("expense_id, user_id, split_amount")
        .eq("expense_id", validExpenseId),
    ).resolves.toMatchObject({
      data: [
        {
          expense_id: validExpenseId,
          user_id: owner.id,
          split_amount: 12.5,
        },
      ],
      error: null,
    });

    await expect(
      actionUpsertRemoteExpenseFromLocal(
        {
          id: invalidExpenseId,
          tripId,
          pinId: null,
          description: "Invalid dinner",
          amount: 12.5,
          currency: "GBP",
          paidByUserId: owner.id,
          paidByName: "Owner",
          participants: [{ userId: owner.id, splitAmount: 10 }],
        },
        owner.client,
      ),
    ).rejects.toThrow(
      "Participant split amounts must equal the expense amount",
    );

    await expect(
      owner.client.from("expense").select("id").eq("id", invalidExpenseId),
    ).resolves.toMatchObject({ data: [], error: null });
    await expect(
      owner.client
        .from("expense_participant")
        .select("expense_id")
        .eq("expense_id", invalidExpenseId),
    ).resolves.toMatchObject({ data: [], error: null });
  });

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
        visibility: "trip",
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
        visibility: "trip",
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

  it("excludes memberships whose trip has been soft deleted", async () => {
    const owner = await createTestUser("del_o");
    const companion = await createTestUser("del_c");
    const tripId = crypto.randomUUID();

    await actionCreateTrip(
      {
        id: tripId,
        title: "Deleted shared trip",
        startDate: "2026-08-01",
        endDate: "2026-08-03",
      },
      owner.client,
    );
    const invitation = await actionCreateTripInvitation(
      { tripId, inviteeUserId: companion.id },
      owner.client,
    );
    await actionAcceptTripInvitation(invitation.id, companion.client);

    expect(
      await actionListCompanionMemberships(companion.client),
    ).toContainEqual(expect.objectContaining({ tripId, status: "active" }));

    await actionSoftDeleteRemoteTrip(tripId, owner.client);

    expect(
      await actionListCompanionMemberships(companion.client),
    ).not.toContainEqual(expect.objectContaining({ tripId }));
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
    await actionUpsertRemotePinLocationFromLocal(
      {
        pinId,
        placeId: "bundle-place",
        displayName: "Bundle Museum",
        formattedAddress: "1 Bundle Road",
        latitude: 51.5,
        longitude: -0.12,
        createdAt: "2026-10-01T00:00:00.000Z",
        updatedAt: "2026-10-01T00:00:00.000Z",
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
        participants: [{ userId: owner.id, splitAmount: 19.5 }],
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
            visibility: "trip",
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

    const left = await actionLeaveTrip(tripId, invitee.client);
    expect(left).toMatchObject({
      status: "disabled",
      disabled_reason: "user_left",
    });
    expect(await actionListTripCompanions(tripId, owner.client)).toContainEqual(
      expect.objectContaining({
        userId: invitee.id,
        state: "LEFT",
      }),
    );

    const reinvitation = await actionCreateTripInvitation(
      { tripId, inviteeUserId: invitee.id },
      owner.client,
    );
    expect(await actionListTripCompanions(tripId, owner.client)).toContainEqual(
      expect.objectContaining({
        userId: invitee.id,
        state: "INVITED",
        tripInvitationId: reinvitation.id,
      }),
    );
    expect(
      (await actionAcceptTripInvitation(reinvitation.id, invitee.client))
        .status,
    ).toBe("accepted");

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
    const readNotifications = await actionMarkNotificationsRead(
      [invitationNotification!.id],
      invitee.client,
    );
    expect(readNotifications).toHaveLength(1);
    expect(readNotifications[0].read_at).not.toBeNull();
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
        emailRedirectTo: "wafflelogv2-dev://auth/callback",
      },
      publicClient,
    );
    expect(signUp.user?.email).toBe(email);
    expect(signUp.session).toBeNull();

    const { error: confirmEmailError } =
      await adminClient.auth.admin.updateUserById(signUp.user!.id, {
        email_confirm: true,
      });
    expect(confirmEmailError).toBeNull();

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
    await actionUpsertRemotePinLocationFromLocal(
      {
        pinId,
        placeId: "bundle-place",
        displayName: "Bundle Museum",
        formattedAddress: "1 Bundle Road",
        latitude: 51.5,
        longitude: -0.12,
        createdAt: "2026-10-01T00:00:00.000Z",
        updatedAt: "2026-10-01T00:00:00.000Z",
      },
      owner.client,
    );
    await actionUpsertRemoteChecklistItemFromLocal(
      {
        id: crypto.randomUUID(),
        tripId,
        title: "Bundle item",
        completed: false,
        visibility: "trip",
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
        participants: [{ userId: owner.id, splitAmount: 42 }],
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
    const imageId = crypto.randomUUID();
    await actionUpsertRemoteImageFromLocal(
      {
        id: imageId,
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
    await actionSoftDeleteRemoteImage(imageId, owner.client);

    const users = await actionListPublicUsers("bundle_owner", owner.client);
    expect(users).toContainEqual(expect.objectContaining({ id: owner.id }));
    await expect(
      actionListRemoteOwnedTripIds(25, 0, owner.client),
    ).resolves.toEqual([tripId]);
    const bundle = await actionGetRemoteTripSyncBundle(tripId, owner.client);
    expect(bundle).toMatchObject({
      trip: { id: tripId, title: "Bundle trip" },
    });
    expect(bundle.pins).toHaveLength(1);
    expect(bundle.pinLocations).toEqual([
      expect.objectContaining({
        pinId,
        userId: owner.id,
        placeId: "bundle-place",
        displayName: "Bundle Museum",
      }),
    ]);
    expect(bundle.checklistItems).toHaveLength(1);
    expect(bundle.notes).toHaveLength(1);
    expect(bundle.referenceLinks).toHaveLength(1);
    expect(bundle.expenses).toHaveLength(1);
    expect(bundle.expenseParticipants).toEqual([
      expect.objectContaining({
        expenseId: bundle.expenses[0].id,
        userId: owner.id,
        splitAmount: 42,
      }),
    ]);
    expect(bundle.documents).toHaveLength(1);
    expect(bundle.images).toHaveLength(1);
    expect(bundle.tripMembers).toEqual([]);
    expect(bundle.images[0]).toEqual(
      expect.objectContaining({
        id: imageId,
        deletedAt: expect.any(String),
      }),
    );
    expect(bundle.userProfiles).toContainEqual(
      expect.objectContaining({ id: owner.id }),
    );
  });
});
