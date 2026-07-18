import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createTestSqliteDatabase, type TestSqliteDatabase } from "./test-db";

const remote = vi.hoisted(() => ({ softDelete: vi.fn(), upsert: vi.fn(), upload: vi.fn() }));
let testDb: TestSqliteDatabase;

vi.mock("@/lib/sqlite/client", () => ({ get sqlite() { return testDb; } }));
vi.mock("@/lib/supabase/actions", () => ({
  actionSoftDeleteRemoteDocument: remote.softDelete,
  actionUpsertRemoteDocumentFromLocal: remote.upsert,
}));
vi.mock("@/lib/supabase/storage", () => ({ uploadTravelDocumentToStorage: remote.upload }));

describe("document sync", () => {
  beforeEach(async () => {
    testDb = createTestSqliteDatabase();
    Object.values(remote).forEach((fn) => fn.mockReset());
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

    await model.actionMarkLocalDocumentSynced(document.id, "user-a");
    await model.actionSoftDeleteLocalDocument(document.id, "user-a");
    remote.softDelete.mockResolvedValue(undefined);
    const [tombstone] = await model.actionListPendingLocalDocuments("user-a");
    await model.actionSyncLocalDocument(tombstone);
    expect(remote.softDelete).toHaveBeenCalledWith(document.id);
    await expect(testDb.getFirstAsync("select id from document where id = ?", [document.id])).resolves.toBeNull();
  });
});
