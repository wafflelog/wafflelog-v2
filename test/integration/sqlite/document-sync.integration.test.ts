import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createTestSqliteDatabase, type TestSqliteDatabase } from "./test-db";

const remote = vi.hoisted(() => ({
  removeLocalFile: vi.fn(),
  removeStorageObject: vi.fn(),
  softDelete: vi.fn(),
  upsert: vi.fn(),
  upload: vi.fn(),
}));
let testDb: TestSqliteDatabase;

vi.mock("@/lib/sqlite/client", () => ({ get sqlite() { return testDb; } }));
vi.mock("@/lib/supabase/actions", () => ({
  actionSoftDeleteRemoteDocument: remote.softDelete,
  actionUpsertRemoteDocumentFromLocal: remote.upsert,
}));
vi.mock("@/lib/supabase/storage", () => ({ uploadTravelDocumentToStorage: remote.upload }));
vi.mock("@/lib/media/local-file", () => ({
  removeLocalFile: remote.removeLocalFile,
}));
vi.mock("@/lib/supabase/storage-object", () => ({
  removeStorageObject: remote.removeStorageObject,
}));

describe("document sync", () => {
  beforeEach(async () => {
    testDb = createTestSqliteDatabase();
    Object.values(remote).forEach((fn) => fn.mockReset());
    remote.removeLocalFile.mockResolvedValue(undefined);
    remote.removeStorageObject.mockResolvedValue(undefined);
    const { initializeDatabase } = await import("@/lib/sqlite/init");
    await initializeDatabase();
  });
  afterEach(() => testDb.close());

  it("uploads local storage first, then upserts the remote document and marks it synced", async () => {
    remote.upload.mockResolvedValue({ storageBucket: "documents", storagePath: "trip-a/document-a.pdf" });
    remote.upsert.mockResolvedValue(undefined);
    const model = await import("@/lib/sqlite/model/document");
    const document = await model.actionCreateLocalDocument({ id: "document-a", tripId: "trip-a", userId: "user-a", fileName: "Ticket.pdf", mimeType: "application/pdf", localUri: "file:///ticket.pdf", caption: "Outbound" });

    await model.actionSyncLocalDocument(document);

    expect(remote.upload).toHaveBeenCalledWith({ tripId: "trip-a", documentId: "document-a", fileName: "Ticket.pdf", mimeType: "application/pdf", localUri: "file:///ticket.pdf" });
    expect(remote.upsert).toHaveBeenCalledWith(expect.objectContaining({ id: "document-a", storageBucket: "documents", storagePath: "trip-a/document-a.pdf" }));
    await expect(testDb.getFirstAsync<{ sync_status: string; storage_bucket: string; storage_path: string }>("select sync_status, storage_bucket, storage_path from document where id = ?", ["document-a"])).resolves.toEqual({ sync_status: "synced", storage_bucket: "documents", storage_path: "trip-a/document-a.pdf" });
  });

  it("keeps a failed document for retry and deletes synced tombstones remotely", async () => {
    remote.upload.mockRejectedValueOnce(new Error("Upload failed"));
    const model = await import("@/lib/sqlite/model/document");
    const document = await model.actionCreateLocalDocument({ id: "document-a", tripId: "trip-a", userId: "user-a", fileName: "Ticket.pdf", mimeType: "application/pdf", localUri: "file:///ticket.pdf" });
    await expect(model.actionSyncLocalDocument(document)).rejects.toThrow("Upload failed");
    await expect(testDb.getFirstAsync<{ sync_status: string; sync_error: string | null }>("select sync_status, sync_error from document where id = ?", [document.id])).resolves.toEqual({ sync_status: "failed", sync_error: "Upload failed" });

    await model.actionMarkLocalDocumentSyncing(document.id, "user-a");
    await model.actionMarkLocalDocumentSynced(document.id, "user-a");
    await model.actionMarkLocalDocumentStorageUploaded(
      document.id,
      "user-a",
      "travel-documents",
      "trip/trip-a/documents/document-a.pdf",
    );
    await model.actionSoftDeleteLocalDocument(document.id, "user-a");
    remote.softDelete.mockResolvedValue(undefined);
    const [tombstone] = await model.actionListPendingLocalDocuments("user-a");
    await model.actionSyncLocalDocument(tombstone);
    expect(remote.softDelete).toHaveBeenCalledWith(document.id);
    expect(remote.removeStorageObject).toHaveBeenCalledWith({
      storageBucket: "travel-documents",
      storagePath: "trip/trip-a/documents/document-a.pdf",
    });
    expect(remote.removeLocalFile).toHaveBeenCalledWith("file:///ticket.pdf");
    await expect(testDb.getFirstAsync("select id from document where id = ?", [document.id])).resolves.toBeNull();
  });

  it("removes an unsynced local document without contacting the remote services", async () => {
    const model = await import("@/lib/sqlite/model/document");
    const document = await model.actionCreateLocalDocument({
      id: "document-a",
      tripId: "trip-a",
      userId: "user-a",
      fileName: "Ticket.pdf",
      mimeType: "application/pdf",
      localUri: "file:///ticket.pdf",
    });

    await model.actionSoftDeleteLocalDocument(document.id, "user-a");
    const [tombstone] = await model.actionListPendingLocalDocuments("user-a");
    await model.actionSyncLocalDocument(tombstone);

    expect(remote.softDelete).not.toHaveBeenCalled();
    expect(remote.removeStorageObject).not.toHaveBeenCalled();
    expect(remote.removeLocalFile).toHaveBeenCalledWith("file:///ticket.pdf");
    await expect(
      testDb.getFirstAsync("select id from document where id = ?", [document.id]),
    ).resolves.toBeNull();
  });

  it("cleans up a partially uploaded document and keeps failures retryable", async () => {
    const model = await import("@/lib/sqlite/model/document");
    const document = await model.actionCreateLocalDocument({
      id: "document-a",
      tripId: "trip-a",
      userId: "user-a",
      fileName: "Ticket.pdf",
      mimeType: "application/pdf",
      localUri: "file:///ticket.pdf",
    });
    await model.actionMarkLocalDocumentStorageUploaded(
      document.id,
      "user-a",
      "travel-documents",
      "trip/trip-a/documents/document-a.pdf",
    );
    await model.actionSoftDeleteLocalDocument(document.id, "user-a");
    remote.softDelete.mockResolvedValue(undefined);
    remote.removeStorageObject.mockRejectedValueOnce(
      new Error("Storage removal failed"),
    );

    let [tombstone] = await model.actionListPendingLocalDocuments("user-a");
    await expect(model.actionSyncLocalDocument(tombstone)).rejects.toThrow(
      "Storage removal failed",
    );
    await expect(
      testDb.getFirstAsync<{ sync_status: string; sync_error: string | null }>(
        "select sync_status, sync_error from document where id = ?",
        [document.id],
      ),
    ).resolves.toEqual({
      sync_status: "failed",
      sync_error: "Storage removal failed",
    });
    expect(remote.removeLocalFile).not.toHaveBeenCalled();

    remote.removeStorageObject.mockResolvedValue(undefined);
    [tombstone] = await model.actionListPendingLocalDocuments("user-a");
    await model.actionSyncLocalDocument(tombstone);

    expect(remote.softDelete).toHaveBeenCalledTimes(2);
    expect(remote.removeStorageObject).toHaveBeenCalledTimes(2);
    expect(remote.removeLocalFile).toHaveBeenCalledWith("file:///ticket.pdf");
    await expect(
      testDb.getFirstAsync("select id from document where id = ?", [document.id]),
    ).resolves.toBeNull();
  });

  it("continues syncing the document batch after one document fails", async () => {
    remote.upload
      .mockRejectedValueOnce(new Error("First upload failed"))
      .mockResolvedValue({
        storageBucket: "documents",
        storagePath: "trip-a/document.pdf",
      });
    remote.upsert.mockResolvedValue(undefined);
    const model = await import("@/lib/sqlite/model/document");

    await model.actionCreateLocalDocument({
      id: "document-a",
      tripId: "trip-a",
      userId: "user-a",
      fileName: "First.pdf",
      mimeType: "application/pdf",
      localUri: "file:///first.pdf",
    });
    await model.actionCreateLocalDocument({
      id: "document-b",
      tripId: "trip-a",
      userId: "user-a",
      fileName: "Second.pdf",
      mimeType: "application/pdf",
      localUri: "file:///second.pdf",
    });

    await expect(
      model.actionSyncPendingLocalDocuments("user-a"),
    ).rejects.toThrow("First upload failed");

    expect(remote.upload).toHaveBeenCalledTimes(2);
    expect(remote.upsert).toHaveBeenCalledTimes(1);
    await expect(
      testDb.getAllAsync<{ sync_status: string }>(
        "select sync_status from document order by sync_status",
      ),
    ).resolves.toEqual([
      { sync_status: "failed" },
      { sync_status: "synced" },
    ]);
  });

  it("only lets the document creator soft-delete a local document", async () => {
    const model = await import("@/lib/sqlite/model/document");
    const document = await model.actionCreateLocalDocument({
      id: "document-a",
      tripId: "trip-a",
      userId: "user-a",
      fileName: "Ticket.pdf",
      mimeType: "application/pdf",
      localUri: "file:///ticket.pdf",
    });

    await expect(
      model.actionSoftDeleteLocalDocument(document.id, "user-b"),
    ).rejects.toThrow(
      "Document not found or you do not have permission to delete it",
    );
    await expect(
      testDb.getFirstAsync<{ deleted_at: string | null }>(
        "select deleted_at from document where id = ?",
        [document.id],
      ),
    ).resolves.toEqual({ deleted_at: null });

    await model.actionSoftDeleteLocalDocument(document.id, "user-a");
    const deletedDocument = await testDb.getFirstAsync<{
      deleted_at: string | null;
      sync_status: string;
    }>("select deleted_at, sync_status from document where id = ?", [
      document.id,
    ]);

    expect(deletedDocument?.deleted_at).not.toBeNull();
    expect(deletedDocument?.sync_status).toBe("pending");
  });

  it("records a downloaded local URI without changing sync metadata", async () => {
    const model = await import("@/lib/sqlite/model/document");
    const document = await model.actionCreateLocalDocument({
      id: "document-a",
      tripId: "trip-a",
      userId: "user-a",
      fileName: "Ticket.pdf",
      mimeType: "application/pdf",
      localUri: "file:///old-ticket.pdf",
    });

    await model.actionSetLocalDocumentUri(
      document.id,
      "file:///downloaded-ticket.pdf",
    );

    await expect(
      testDb.getFirstAsync<{
        local_uri: string;
        sync_status: string;
        updated_at: string;
      }>(
        "select local_uri, sync_status, updated_at from document where id = ?",
        [document.id],
      ),
    ).resolves.toEqual({
      local_uri: "file:///downloaded-ticket.pdf",
      sync_status: document.syncStatus,
      updated_at: document.updatedAt,
    });
  });
});
