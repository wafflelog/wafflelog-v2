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
  actionSoftDeleteRemoteImage: remote.softDelete,
  actionUpsertRemoteImageFromLocal: remote.upsert,
}));
vi.mock("@/lib/media/image", () => ({ uploadImageToStorage: remote.upload }));
vi.mock("@/lib/media/local-file", () => ({
  removeLocalFile: remote.removeLocalFile,
}));
vi.mock("@/lib/supabase/storage-object", () => ({
  removeStorageObject: remote.removeStorageObject,
}));

describe("image sync", () => {
  beforeEach(async () => {
    testDb = createTestSqliteDatabase();
    Object.values(remote).forEach((fn) => fn.mockReset());
    remote.removeLocalFile.mockResolvedValue(undefined);
    remote.removeStorageObject.mockResolvedValue(undefined);
    const { initializeDatabase } = await import("@/lib/sqlite/init");
    await initializeDatabase();
  });
  afterEach(() => testDb.close());

  it("uploads local storage first, then upserts the remote image and marks it synced", async () => {
    remote.upload.mockResolvedValue({ storageBucket: "images", storagePath: "trip-a/image-a.jpg" });
    remote.upsert.mockResolvedValue(undefined);
    const model = await import("@/lib/sqlite/model/image");
    const image = await model.actionCreateLocalImage({ id: "image-a", pinId: "pin-a", tripId: "trip-a", userId: "user-a", localUri: "file:///image.jpg", mimeType: "image/jpeg", width: 100, height: 200, caption: "View" });

    await model.actionSyncLocalImage(image);

    expect(remote.upload).toHaveBeenCalledWith({ tripId: "trip-a", pinId: "pin-a", imageId: "image-a", fileName: "image-a.jpeg", mimeType: "image/jpeg", localUri: "file:///image.jpg" });
    expect(remote.upsert).toHaveBeenCalledWith(expect.objectContaining({ id: "image-a", storageBucket: "images", storagePath: "trip-a/image-a.jpg" }));
    await expect(testDb.getFirstAsync<{ sync_status: string; storage_bucket: string; storage_path: string }>("select sync_status, storage_bucket, storage_path from image where id = ?", ["image-a"])).resolves.toEqual({ sync_status: "synced", storage_bucket: "images", storage_path: "trip-a/image-a.jpg" });
  });

  it("keeps failed image uploads retryable and remotely deletes synced tombstones", async () => {
    remote.upload.mockRejectedValueOnce(new Error("Upload failed"));
    const model = await import("@/lib/sqlite/model/image");
    const image = await model.actionCreateLocalImage({ id: "image-a", tripId: "trip-a", userId: "user-a", localUri: "file:///image.jpg", mimeType: "image/jpeg", width: 100, height: 200 });
    await expect(model.actionSyncLocalImage(image)).rejects.toThrow("Upload failed");
    await expect(testDb.getFirstAsync<{ sync_status: string; sync_error: string | null }>("select sync_status, sync_error from image where id = ?", [image.id])).resolves.toEqual({ sync_status: "failed", sync_error: "Upload failed" });

    await model.actionMarkLocalImageSyncing(image.id, "user-a");
    await model.actionMarkLocalImageSynced(image.id, "user-a");
    await model.actionMarkLocalImageStorageUploaded(
      image.id,
      "user-a",
      "images",
      "trip/trip-a/images/image-a.jpg",
    );
    await model.actionSoftDeleteLocalImage(image.id, "user-a");
    remote.softDelete.mockResolvedValue(undefined);
    const [tombstone] = await model.actionListPendingLocalImages("user-a");
    await model.actionSyncLocalImage(tombstone);
    expect(remote.softDelete).toHaveBeenCalledWith(image.id);
    expect(remote.removeStorageObject).toHaveBeenCalledWith({
      storageBucket: "images",
      storagePath: "trip/trip-a/images/image-a.jpg",
    });
    expect(remote.removeLocalFile).toHaveBeenCalledWith("file:///image.jpg");
    await expect(testDb.getFirstAsync("select id from image where id = ?", [image.id])).resolves.toBeNull();
  });

  it("removes an unsynced local image without contacting the remote services", async () => {
    const model = await import("@/lib/sqlite/model/image");
    const image = await model.actionCreateLocalImage({
      id: "image-a",
      tripId: "trip-a",
      userId: "user-a",
      localUri: "file:///image.jpg",
      mimeType: "image/jpeg",
      width: 100,
      height: 200,
    });

    await model.actionSoftDeleteLocalImage(image.id, "user-a");
    const [tombstone] = await model.actionListPendingLocalImages("user-a");
    await model.actionSyncLocalImage(tombstone);

    expect(remote.softDelete).not.toHaveBeenCalled();
    expect(remote.removeStorageObject).not.toHaveBeenCalled();
    expect(remote.removeLocalFile).toHaveBeenCalledWith("file:///image.jpg");
    await expect(
      testDb.getFirstAsync("select id from image where id = ?", [image.id]),
    ).resolves.toBeNull();
  });

  it("cleans up a partially uploaded image and keeps failures retryable", async () => {
    const model = await import("@/lib/sqlite/model/image");
    const image = await model.actionCreateLocalImage({
      id: "image-a",
      tripId: "trip-a",
      userId: "user-a",
      localUri: "file:///image.jpg",
      mimeType: "image/jpeg",
      width: 100,
      height: 200,
    });
    await model.actionMarkLocalImageStorageUploaded(
      image.id,
      "user-a",
      "images",
      "trip/trip-a/images/image-a.jpg",
    );
    await model.actionSoftDeleteLocalImage(image.id, "user-a");
    remote.softDelete.mockResolvedValue(undefined);
    remote.removeStorageObject.mockRejectedValueOnce(
      new Error("Storage removal failed"),
    );

    let [tombstone] = await model.actionListPendingLocalImages("user-a");
    await expect(model.actionSyncLocalImage(tombstone)).rejects.toThrow(
      "Storage removal failed",
    );
    await expect(
      testDb.getFirstAsync<{ sync_status: string; sync_error: string | null }>(
        "select sync_status, sync_error from image where id = ?",
        [image.id],
      ),
    ).resolves.toEqual({
      sync_status: "failed",
      sync_error: "Storage removal failed",
    });
    expect(remote.removeLocalFile).not.toHaveBeenCalled();

    remote.removeStorageObject.mockResolvedValue(undefined);
    [tombstone] = await model.actionListPendingLocalImages("user-a");
    await model.actionSyncLocalImage(tombstone);

    expect(remote.softDelete).toHaveBeenCalledTimes(2);
    expect(remote.removeStorageObject).toHaveBeenCalledTimes(2);
    expect(remote.removeLocalFile).toHaveBeenCalledWith("file:///image.jpg");
    await expect(
      testDb.getFirstAsync("select id from image where id = ?", [image.id]),
    ).resolves.toBeNull();
  });

  it("records a downloaded image URI without changing its sync state", async () => {
    const model = await import("@/lib/sqlite/model/image");
    const image = await model.actionCreateLocalImage({
      id: "image-a",
      tripId: "trip-a",
      userId: "user-a",
      localUri: "file:///original.jpg",
      mimeType: "image/jpeg",
      width: 100,
      height: 200,
    });

    await model.actionMarkLocalImageSyncing(image.id, "user-a");
    await model.actionMarkLocalImageSynced(image.id, "user-a");
    await model.actionSetLocalImageUri(
      image.id,
      "file:///documents/images/cache/image-a.jpg",
    );

    await expect(
      testDb.getFirstAsync<{
        local_uri: string | null;
        sync_status: string;
      }>("select local_uri, sync_status from image where id = ?", [image.id]),
    ).resolves.toEqual({
      local_uri: "file:///documents/images/cache/image-a.jpg",
      sync_status: "synced",
    });
  });
});
