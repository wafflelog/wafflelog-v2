import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createTestSqliteDatabase,
  type TestSqliteDatabase,
} from "./test-db";

let testDb: TestSqliteDatabase;

vi.mock("@/lib/sqlite/client", () => ({
  get sqlite() {
    return testDb;
  },
}));

vi.mock("@/lib/supabase/actions", () => ({
  actionSoftDeleteRemoteNote: vi.fn(),
  actionUpsertRemoteNoteFromLocal: vi.fn(),
  actionSoftDeleteRemoteReferenceLink: vi.fn(),
  actionUpsertRemoteReferenceLinkFromLocal: vi.fn(),
  actionSoftDeleteRemoteDocument: vi.fn(),
  actionUpsertRemoteDocumentFromLocal: vi.fn(),
  actionSoftDeleteRemoteImage: vi.fn(),
  actionUpsertRemoteImageFromLocal: vi.fn(),
}));

vi.mock("@/lib/supabase/storage", () => ({
  uploadTravelDocumentToStorage: vi.fn(),
}));

vi.mock("@/lib/media/image", () => ({
  uploadImageToStorage: vi.fn(),
}));

describe("local content entities", () => {
  beforeEach(async () => {
    testDb = createTestSqliteDatabase();
    const { initializeDatabase } = await import("@/lib/sqlite/init");
    await initializeDatabase();
  });

  afterEach(() => {
    testDb.close();
  });

  it("creates, filters, and deletes immutable notes", async () => {
    const {
      actionCreateLocalNote,
      actionHardDeleteLocalNote,
      actionListLocalNotesByPin,
      actionListLocalNotesByTrip,
      actionListPendingLocalNotes,
      actionSoftDeleteLocalNote,
    } = await import("@/lib/sqlite/model/note");
    const pinNote = await actionCreateLocalNote({
      tripId: "trip-a",
      pinId: "pin-a",
      userId: "user-a",
      text: "  Pin note  ",
    });
    const tripNote = await actionCreateLocalNote({
      tripId: "trip-a",
      userId: "user-a",
      text: "Trip note",
    });
    const otherUser = await actionCreateLocalNote({
      tripId: "trip-a",
      userId: "user-b",
      text: "Other user",
    });
    await testDb.runAsync("update note set created_at = ? where id = ?", [
      "2026-01-01T00:00:00.000Z",
      pinNote.id,
    ]);

    expect(pinNote).toMatchObject({ text: "Pin note", syncStatus: "pending" });
    await expect(actionListLocalNotesByPin("pin-a", "user-a")).resolves.toEqual([
      expect.objectContaining({ id: pinNote.id }),
    ]);
    await expect(actionListLocalNotesByTrip("trip-a", "user-a")).resolves.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: tripNote.id })]),
    );
    await expect(actionListPendingLocalNotes("user-a", 1)).resolves.toEqual([
      expect.objectContaining({ id: pinNote.id }),
    ]);

    await actionSoftDeleteLocalNote(pinNote.id, "user-b");
    await expect(actionListLocalNotesByPin("pin-a", "user-a")).resolves.toHaveLength(
      1,
    );
    await actionSoftDeleteLocalNote(pinNote.id, "user-a");
    await expect(actionListLocalNotesByPin("pin-a", "user-a")).resolves.toEqual([]);
    await actionHardDeleteLocalNote(pinNote.id, "user-a");
    await expect(
      testDb.getFirstAsync<{ id: string }>("select id from note where id = ?", [
        pinNote.id,
      ]),
    ).resolves.toBeNull();
    expect(otherUser.userId).toBe("user-b");
  });

  it("creates, derives, filters, and deletes immutable reference links", async () => {
    const {
      actionCreateLocalReferenceLink,
      actionHardDeleteLocalReferenceLink,
      actionListLocalReferenceLinksByPin,
      actionListLocalReferenceLinksByTrip,
      actionListPendingLocalReferenceLinks,
      actionSoftDeleteLocalReferenceLink,
    } = await import("@/lib/sqlite/model/reference-link");
    const pinLink = await actionCreateLocalReferenceLink({
      tripId: "trip-a",
      pinId: "pin-a",
      userId: "user-a",
      url: " https://example.com/path ",
      caption: "  Useful link  ",
    });
    const tripLink = await actionCreateLocalReferenceLink({
      tripId: "trip-a",
      userId: "user-a",
      url: "https://example.org",
    });
    await testDb.runAsync("update reference_link set created_at = ? where id = ?", [
      "2026-01-01T00:00:00.000Z",
      pinLink.id,
    ]);

    expect(pinLink).toMatchObject({
      url: "https://example.com/path",
      title: "example.com",
      caption: "Useful link",
    });
    await expect(
      actionListLocalReferenceLinksByPin("pin-a", "user-a"),
    ).resolves.toEqual([expect.objectContaining({ id: pinLink.id })]);
    await expect(
      actionListLocalReferenceLinksByTrip("trip-a", "user-a"),
    ).resolves.toEqual(expect.arrayContaining([expect.objectContaining({ id: tripLink.id })]));
    await expect(
      actionListPendingLocalReferenceLinks("user-a", 1),
    ).resolves.toEqual([expect.objectContaining({ id: pinLink.id })]);

    await actionSoftDeleteLocalReferenceLink(pinLink.id, "user-b");
    await expect(actionListLocalReferenceLinksByPin("pin-a", "user-a")).resolves.toHaveLength(
      1,
    );
    await actionSoftDeleteLocalReferenceLink(pinLink.id, "user-a");
    await expect(actionListLocalReferenceLinksByPin("pin-a", "user-a")).resolves.toEqual([]);
    await actionHardDeleteLocalReferenceLink(pinLink.id, "user-a");
    await expect(
      testDb.getFirstAsync<{ id: string }>(
        "select id from reference_link where id = ?",
        [pinLink.id],
      ),
    ).resolves.toBeNull();
  });

  it("creates, filters, and deletes immutable documents", async () => {
    const {
      actionCreateLocalDocument,
      actionHardDeleteLocalDocument,
      actionListLocalDocumentsByPin,
      actionListLocalDocumentsByTrip,
      actionListPendingLocalDocuments,
      actionSoftDeleteLocalDocument,
    } = await import("@/lib/sqlite/model/document");
    const pinDocument = await actionCreateLocalDocument({
      id: "document-a",
      tripId: "trip-a",
      pinId: "pin-a",
      userId: "user-a",
      fileName: "  Ticket.pdf  ",
      mimeType: " application/pdf ",
      localUri: " file:///ticket.pdf ",
      caption: "  Outbound  ",
    });
    const tripDocument = await actionCreateLocalDocument({
      id: "document-b",
      tripId: "trip-a",
      userId: "user-a",
      fileName: "Hotel.pdf",
      mimeType: "application/pdf",
      localUri: "file:///hotel.pdf",
    });
    await testDb.runAsync("update document set created_at = ? where id = ?", [
      "2026-01-01T00:00:00.000Z",
      pinDocument.id,
    ]);

    expect(pinDocument).toMatchObject({
      fileName: "Ticket.pdf",
      mimeType: "application/pdf",
      localUri: "file:///ticket.pdf",
      caption: "Outbound",
    });
    await expect(actionListLocalDocumentsByPin("pin-a", "user-a")).resolves.toEqual([
      expect.objectContaining({ id: pinDocument.id }),
    ]);
    await expect(actionListLocalDocumentsByTrip("trip-a", "user-a")).resolves.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: tripDocument.id })]),
    );
    await expect(actionListPendingLocalDocuments("user-a", 1)).resolves.toEqual([
      expect.objectContaining({ id: pinDocument.id }),
    ]);

    await actionSoftDeleteLocalDocument(pinDocument.id, "user-b");
    await expect(actionListLocalDocumentsByPin("pin-a", "user-a")).resolves.toHaveLength(
      1,
    );
    await actionSoftDeleteLocalDocument(pinDocument.id, "user-a");
    await expect(actionListLocalDocumentsByPin("pin-a", "user-a")).resolves.toEqual([]);
    await actionHardDeleteLocalDocument(pinDocument.id, "user-a");
    await expect(
      testDb.getFirstAsync<{ id: string }>("select id from document where id = ?", [
        pinDocument.id,
      ]),
    ).resolves.toBeNull();
  });

  it("creates, counts, filters, and deletes immutable images", async () => {
    const {
      actionCountLocalImagesByPin,
      actionCreateLocalImage,
      actionHardDeleteLocalImage,
      actionListLocalImagesByPin,
      actionListLocalImagesByTrip,
      actionListPendingLocalImages,
      actionSoftDeleteLocalImage,
    } = await import("@/lib/sqlite/model/image");
    const pinImage = await actionCreateLocalImage({
      id: "image-a",
      pinId: "pin-a",
      tripId: "trip-a",
      userId: "user-a",
      localUri: " file:///photo.jpg ",
      mimeType: " image/jpeg ",
      width: 100,
      height: 200,
      caption: "  View  ",
    });
    const tripImage = await actionCreateLocalImage({
      id: "image-b",
      tripId: "trip-a",
      userId: "user-a",
      localUri: "file:///trip.jpg",
      mimeType: "image/jpeg",
      width: 100,
      height: 100,
    });
    await testDb.runAsync("update image set created_at = ? where id = ?", [
      "2026-01-01T00:00:00.000Z",
      pinImage.id,
    ]);

    expect(pinImage).toMatchObject({
      localUri: "file:///photo.jpg",
      mimeType: "image/jpeg",
      caption: "View",
    });
    await expect(actionCountLocalImagesByPin("pin-a", "user-a")).resolves.toBe(1);
    await expect(actionListLocalImagesByPin("pin-a", "user-a")).resolves.toEqual([
      expect.objectContaining({ id: pinImage.id }),
    ]);
    await expect(actionListLocalImagesByTrip("trip-a", "user-a")).resolves.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: tripImage.id })]),
    );
    await expect(actionListPendingLocalImages("user-a", 1)).resolves.toEqual([
      expect.objectContaining({ id: pinImage.id }),
    ]);

    await actionSoftDeleteLocalImage(pinImage.id, "user-b");
    await expect(actionListLocalImagesByPin("pin-a", "user-a")).resolves.toHaveLength(
      1,
    );
    await actionSoftDeleteLocalImage(pinImage.id, "user-a");
    await expect(actionListLocalImagesByPin("pin-a", "user-a")).resolves.toEqual([]);
    await actionHardDeleteLocalImage(pinImage.id, "user-a");
    await expect(
      testDb.getFirstAsync<{ id: string }>("select id from image where id = ?", [
        pinImage.id,
      ]),
    ).resolves.toBeNull();
  });
});
