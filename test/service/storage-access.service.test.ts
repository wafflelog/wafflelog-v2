import { describe, expect, it } from "vitest";

import { createTestUser } from "./local-supabase";

describe("Storage access RLS", () => {
  it("allows active members to download trip files and revokes access when disabled", async () => {
    const owner = await createTestUser("owner");
    const companion = await createTestUser("companion");
    const unrelated = await createTestUser("unrelated");
    const tripId = crypto.randomUUID();
    const imagePath = `trip/${tripId}/images/${crypto.randomUUID()}.txt`;
    const documentPath = `trip/${tripId}/documents/${crypto.randomUUID()}.txt`;
    const companionDocumentPath =
      `trip/${tripId}/documents/${crypto.randomUUID()}.txt`;
    const unrelatedImagePath = `trip/${tripId}/images/${crypto.randomUUID()}.txt`;
    const unrelatedDocumentPath =
      `trip/${tripId}/documents/${crypto.randomUUID()}.txt`;
    const disabledImagePath = `trip/${tripId}/images/${crypto.randomUUID()}.txt`;
    const disabledDocumentPath =
      `trip/${tripId}/documents/${crypto.randomUUID()}.txt`;

    const { error: tripError } = await owner.client.from("trip").insert({
      id: tripId,
      user_id: owner.id,
      title: "Storage service test trip",
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

    const file = new Blob(["service test file"], { type: "text/plain" });
    const [{ error: imageUploadError }, { error: documentUploadError }] = await Promise.all([
      owner.client.storage
        .from("images")
        .upload(imagePath, file, { contentType: "text/plain" }),
      owner.client.storage
        .from("travel-documents")
        .upload(documentPath, file, { contentType: "text/plain" }),
    ]);
    expect(imageUploadError).toBeNull();
    expect(documentUploadError).toBeNull();

    const [companionUpload, unrelatedImageUpload, unrelatedDocumentUpload] =
      await Promise.all([
        companion.client.storage
          .from("travel-documents")
          .upload(companionDocumentPath, file, { contentType: "text/plain" }),
        unrelated.client.storage
          .from("images")
          .upload(unrelatedImagePath, file, { contentType: "text/plain" }),
        unrelated.client.storage
          .from("travel-documents")
          .upload(unrelatedDocumentPath, file, { contentType: "text/plain" }),
      ]);
    expect(companionUpload.error).toBeNull();
    expect(unrelatedImageUpload.error).not.toBeNull();
    expect(unrelatedDocumentUpload.error).not.toBeNull();

    const [companionImage, companionDocument, unrelatedImage, unrelatedDocument] =
      await Promise.all([
        companion.client.storage.from("images").download(imagePath),
        companion.client.storage.from("travel-documents").download(documentPath),
        unrelated.client.storage.from("images").download(imagePath),
        unrelated.client.storage.from("travel-documents").download(documentPath),
      ]);
    expect(companionImage.error).toBeNull();
    expect(companionImage.data).toBeInstanceOf(Blob);
    expect(companionDocument.error).toBeNull();
    expect(companionDocument.data).toBeInstanceOf(Blob);
    expect(unrelatedImage.error).not.toBeNull();
    expect(unrelatedDocument.error).not.toBeNull();

    const { error: disableError } = await owner.client
      .from("trip_member")
      .update({ status: "disabled", disabled_reason: "owner_disabled" })
      .eq("trip_id", tripId)
      .eq("user_id", companion.id);
    expect(disableError).toBeNull();

    const [disabledImage, disabledDocument] = await Promise.all([
      companion.client.storage.from("images").download(imagePath),
      companion.client.storage.from("travel-documents").download(documentPath),
    ]);
    expect(disabledImage.error).not.toBeNull();
    expect(disabledDocument.error).not.toBeNull();

    const [disabledImageUpload, disabledDocumentUpload] = await Promise.all([
      companion.client.storage
        .from("images")
        .upload(disabledImagePath, file, { contentType: "text/plain" }),
      companion.client.storage
        .from("travel-documents")
        .upload(disabledDocumentPath, file, { contentType: "text/plain" }),
    ]);
    expect(disabledImageUpload.error).not.toBeNull();
    expect(disabledDocumentUpload.error).not.toBeNull();
  });
});
