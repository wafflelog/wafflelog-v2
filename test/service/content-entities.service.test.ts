import { describe, expect, it } from "vitest";

import { createTestUser } from "./local-supabase";

describe("content entity RLS", () => {
  it("allows active companions to create shared content metadata while excluding unrelated users", async () => {
    const owner = await createTestUser("owner");
    const companion = await createTestUser("companion");
    const unrelated = await createTestUser("unrelated");
    const tripId = crypto.randomUUID();
    const pinId = crypto.randomUUID();
    const noteId = crypto.randomUUID();
    const referenceLinkId = crypto.randomUUID();
    const documentId = crypto.randomUUID();
    const imageId = crypto.randomUUID();

    const { error: tripError } = await owner.client.from("trip").insert({
      id: tripId,
      user_id: owner.id,
      title: "Content entity service test trip",
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

    const { error: pinError } = await companion.client.from("pin").insert({
      id: pinId,
      trip_id: tripId,
      user_id: companion.id,
      name: "Companion pin",
      start_date: "2026-05-01",
      category_id: "other",
    });
    expect(pinError).toBeNull();

    const [note, referenceLink, document, image] = await Promise.all([
      companion.client
        .from("note")
        .insert({
          id: noteId,
          trip_id: tripId,
          pin_id: pinId,
          user_id: companion.id,
          text: "Companion note",
        })
        .select("id, user_id")
        .single(),
      companion.client
        .from("reference_link")
        .insert({
          id: referenceLinkId,
          trip_id: tripId,
          pin_id: pinId,
          user_id: companion.id,
          title: "Companion link",
          url: "https://example.com",
        })
        .select("id, user_id")
        .single(),
      companion.client
        .from("document")
        .insert({
          id: documentId,
          trip_id: tripId,
          pin_id: pinId,
          user_id: companion.id,
          file_name: "itinerary.pdf",
          mime_type: "application/pdf",
          storage_bucket: "travel-documents",
          storage_path: `trip/${tripId}/documents/${documentId}-itinerary.pdf`,
        })
        .select("id, user_id")
        .single(),
      companion.client
        .from("image")
        .insert({
          id: imageId,
          trip_id: tripId,
          pin_id: pinId,
          user_id: companion.id,
          storage_bucket: "images",
          storage_path: `trip/${tripId}/images/${imageId}.jpg`,
          mime_type: "image/jpeg",
          width: 100,
          height: 80,
        })
        .select("id, user_id")
        .single(),
    ]);
    for (const result of [note, referenceLink, document, image]) {
      expect(result.error).toBeNull();
      expect(result.data).toEqual({ id: expect.any(String), user_id: companion.id });
    }

    const [ownerNotes, ownerLinks, ownerDocuments, ownerImages, unrelatedNotes, unrelatedLinks, unrelatedDocuments, unrelatedImages] =
      await Promise.all([
        owner.client.from("note").select("id").eq("id", noteId),
        owner.client.from("reference_link").select("id").eq("id", referenceLinkId),
        owner.client.from("document").select("id").eq("id", documentId),
        owner.client.from("image").select("id").eq("id", imageId),
        unrelated.client.from("note").select("id").eq("id", noteId),
        unrelated.client.from("reference_link").select("id").eq("id", referenceLinkId),
        unrelated.client.from("document").select("id").eq("id", documentId),
        unrelated.client.from("image").select("id").eq("id", imageId),
      ]);
    for (const result of [ownerNotes, ownerLinks, ownerDocuments, ownerImages]) {
      expect(result.error).toBeNull();
      expect(result.data).toEqual([{ id: expect.any(String) }]);
    }
    for (const result of [unrelatedNotes, unrelatedLinks, unrelatedDocuments, unrelatedImages]) {
      expect(result.error).toBeNull();
      expect(result.data).toEqual([]);
    }
  });
});
