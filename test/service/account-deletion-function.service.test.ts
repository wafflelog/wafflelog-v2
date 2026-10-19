import { describe, expect, it } from "vitest";

import { adminClient, createTestUser } from "./local-supabase";

function requireEnv(value: string | undefined, name: string) {
  if (!value) {
    throw new Error(`Set ${name} in supabase/.env.`);
  }

  return value;
}

const functionUrl = `${requireEnv(
  process.env.SUPABASE_LOCAL_URL,
  "SUPABASE_LOCAL_URL",
)}/functions/v1/delete-account`;
const publishableKey = requireEnv(
  process.env.SUPABASE_LOCAL_PUBLISHABLE_KEY,
  "SUPABASE_LOCAL_PUBLISHABLE_KEY",
);

describe("delete account Edge Function", () => {
  it("rejects an unauthenticated deletion request", async () => {
    const response = await fetch(functionUrl, {
      method: "POST",
      headers: { apikey: publishableKey },
    });

    expect(response.ok).toBe(false);
    expect([401, 403]).toContain(response.status);
  });

  it("deletes the authenticated owner, their trip, and the trip files", async () => {
    const owner = await createTestUser("delete_fn_owner");
    const companion = await createTestUser("delete_fn_comp");
    const tripId = crypto.randomUUID();
    const imageId = crypto.randomUUID();
    const documentId = crypto.randomUUID();
    const imagePath = `trip/${tripId}/images/${imageId}.jpg`;
    const documentPath = `trip/${tripId}/documents/${documentId}.pdf`;

    const { error: tripError } = await owner.client.from("trip").insert({
      id: tripId,
      user_id: owner.id,
      title: "Account deletion function test",
      start_date: "2026-10-19",
      end_date: "2026-10-21",
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

    const { error: acceptError } = await companion.client
      .from("trip_invitation")
      .update({ status: "accepted" })
      .eq("id", invitation!.id);
    expect(acceptError).toBeNull();

    const [imageUpload, documentUpload] = await Promise.all([
      owner.client.storage
        .from("images")
        .upload(imagePath, new Blob(["image"], { type: "image/jpeg" }), {
          contentType: "image/jpeg",
        }),
      companion.client.storage
        .from("travel-documents")
        .upload(
          documentPath,
          new Blob(["document"], { type: "application/pdf" }),
          { contentType: "application/pdf" },
        ),
    ]);
    expect(imageUpload.error).toBeNull();
    expect(documentUpload.error).toBeNull();

    const [imageMetadata, documentMetadata] = await Promise.all([
      owner.client.from("image").insert({
        id: imageId,
        trip_id: tripId,
        user_id: owner.id,
        storage_bucket: "images",
        storage_path: imagePath,
        mime_type: "image/jpeg",
        width: 1,
        height: 1,
      }),
      companion.client.from("document").insert({
        id: documentId,
        trip_id: tripId,
        user_id: companion.id,
        file_name: "deletion-test.pdf",
        mime_type: "application/pdf",
        storage_bucket: "travel-documents",
        storage_path: documentPath,
      }),
    ]);
    expect(imageMetadata.error).toBeNull();
    expect(documentMetadata.error).toBeNull();

    const { data: deletionResult, error: invocationError } =
      await owner.client.functions.invoke("delete-account", {
        method: "POST",
      });

    expect(invocationError).toBeNull();
    expect(deletionResult).toEqual({ ok: true });

    const [deletedAuthUser, deletedTrip, deletedImage, deletedDocument] =
      await Promise.all([
        adminClient.auth.admin.getUserById(owner.id),
        adminClient.from("trip").select("id").eq("id", tripId),
        adminClient.storage.from("images").download(imagePath),
        adminClient.storage.from("travel-documents").download(documentPath),
      ]);

    expect(deletedAuthUser.error).not.toBeNull();
    expect(deletedAuthUser.data.user).toBeNull();
    expect(deletedTrip.error).toBeNull();
    expect(deletedTrip.data).toEqual([]);
    expect(deletedImage.error).not.toBeNull();
    expect(deletedDocument.error).not.toBeNull();

    const { data: survivingCompanion, error: survivingCompanionError } =
      await adminClient.auth.admin.getUserById(companion.id);
    expect(survivingCompanionError).toBeNull();
    expect(survivingCompanion.user?.id).toBe(companion.id);
  });
});
