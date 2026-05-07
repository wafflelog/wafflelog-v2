import { sqlite } from "@/lib/sqlite/client";
import { buildUUID } from "@/lib/sqlite/utils";
import { actionUpsertRemoteImageFromLocal } from "@/lib/supabase/actions";
import { uploadPinImageToStorage } from "@/lib/media/image";

export type LocalImage = {
  id: string;
  pinId: string;
  tripId: string;
  userId: string;
  localUri: string;
  storageBucket: string;
  storagePath: string;
  mimeType: string;
  width: number;
  height: number;
  caption: string | null;
  createdAt: string;
  updatedAt: string;
  syncStatus: string;
  lastSyncedAt: string | null;
  syncError: string | null;
};

export type CreateLocalImageInput = {
  id?: string;
  pinId: string;
  tripId: string;
  userId: string;
  localUri: string;
  storageBucket?: string;
  storagePath?: string;
  mimeType: string;
  width: number;
  height: number;
  caption?: string;
};

const DEFAULT_SYNC_BATCH_SIZE = 25;

function mapLocalImageRow(row: {
  id: string;
  pin_id: string;
  trip_id: string;
  user_id: string;
  local_uri: string;
  storage_bucket: string;
  storage_path: string;
  mime_type: string;
  width: number;
  height: number;
  caption: string | null;
  created_at: string;
  updated_at: string;
  sync_status: string;
  last_synced_at: string | null;
  sync_error: string | null;
}): LocalImage {
  return {
    id: row.id,
    pinId: row.pin_id,
    tripId: row.trip_id,
    userId: row.user_id,
    localUri: row.local_uri,
    storageBucket: row.storage_bucket,
    storagePath: row.storage_path,
    mimeType: row.mime_type,
    width: row.width,
    height: row.height,
    caption: row.caption,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    syncStatus: row.sync_status,
    lastSyncedAt: row.last_synced_at,
    syncError: row.sync_error,
  };
}

export async function actionCreateLocalImage(input: CreateLocalImageInput) {
  const now = new Date().toISOString();
  const localImage = {
    id: input.id ?? buildUUID(),
    pin_id: input.pinId,
    trip_id: input.tripId,
    user_id: input.userId,
    local_uri: input.localUri.trim(),
    storage_bucket: input.storageBucket?.trim() ?? "",
    storage_path: input.storagePath?.trim() ?? "",
    mime_type: input.mimeType.trim(),
    width: input.width,
    height: input.height,
    caption: input.caption?.trim() || null,
    created_at: now,
    updated_at: now,
    sync_status: "pending",
    last_synced_at: null,
    sync_error: null,
  };

  await sqlite.runAsync(
    `
      insert into image (
        id,
        pin_id,
        trip_id,
        user_id,
        local_uri,
        storage_bucket,
        storage_path,
        mime_type,
        width,
        height,
        caption,
        created_at,
        updated_at,
        sync_status,
        last_synced_at,
        sync_error
      ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      localImage.id,
      localImage.pin_id,
      localImage.trip_id,
      localImage.user_id,
      localImage.local_uri,
      localImage.storage_bucket,
      localImage.storage_path,
      localImage.mime_type,
      localImage.width,
      localImage.height,
      localImage.caption,
      localImage.created_at,
      localImage.updated_at,
      localImage.sync_status,
      localImage.last_synced_at,
      localImage.sync_error,
    ],
  );

  return mapLocalImageRow(localImage);
}

export async function actionListLocalImagesByPin(
  pinId: string,
  userId: string,
) {
  const rows = await sqlite.getAllAsync<{
    id: string;
    pin_id: string;
    trip_id: string;
    user_id: string;
    local_uri: string;
    storage_bucket: string;
    storage_path: string;
    mime_type: string;
    width: number;
    height: number;
    caption: string | null;
    created_at: string;
    updated_at: string;
    sync_status: string;
    last_synced_at: string | null;
    sync_error: string | null;
  }>(
    `
      select
        id,
        pin_id,
        trip_id,
        user_id,
        local_uri,
        storage_bucket,
        storage_path,
        mime_type,
        width,
        height,
        caption,
        created_at,
        updated_at,
        sync_status,
        last_synced_at,
        sync_error
      from image
      where pin_id = ? and user_id = ?
      order by created_at desc
    `,
    [pinId, userId],
  );

  return rows.map(mapLocalImageRow);
}

export async function actionCountLocalImagesByPin(
  pinId: string,
  userId: string,
) {
  const row = await sqlite.getFirstAsync<{ total: number }>(
    `
      select count(*) as total
      from image
      where pin_id = ? and user_id = ?
    `,
    [pinId, userId],
  );

  return row?.total ?? 0;
}

export async function actionListLocalImagesByTrip(
  tripId: string,
  userId: string,
) {
  const rows = await sqlite.getAllAsync<{
    id: string;
    pin_id: string;
    trip_id: string;
    user_id: string;
    local_uri: string;
    storage_bucket: string;
    storage_path: string;
    mime_type: string;
    width: number;
    height: number;
    caption: string | null;
    created_at: string;
    updated_at: string;
    sync_status: string;
    last_synced_at: string | null;
    sync_error: string | null;
  }>(
    `
      select
        id,
        pin_id,
        trip_id,
        user_id,
        local_uri,
        storage_bucket,
        storage_path,
        mime_type,
        width,
        height,
        caption,
        created_at,
        updated_at,
        sync_status,
        last_synced_at,
        sync_error
      from image
      where trip_id = ? and user_id = ?
      order by created_at desc
    `,
    [tripId, userId],
  );

  return rows.map(mapLocalImageRow);
}

export async function actionListPendingLocalImages(
  userId: string,
  limit = DEFAULT_SYNC_BATCH_SIZE,
) {
  const rows = await sqlite.getAllAsync<{
    id: string;
    pin_id: string;
    trip_id: string;
    user_id: string;
    local_uri: string;
    storage_bucket: string;
    storage_path: string;
    mime_type: string;
    width: number;
    height: number;
    caption: string | null;
    created_at: string;
    updated_at: string;
    sync_status: string;
    last_synced_at: string | null;
    sync_error: string | null;
  }>(
    `
      select
        id,
        pin_id,
        trip_id,
        user_id,
        local_uri,
        storage_bucket,
        storage_path,
        mime_type,
        width,
        height,
        caption,
        created_at,
        updated_at,
        sync_status,
        last_synced_at,
        sync_error
      from image
      where user_id = ? and sync_status != 'synced'
      order by created_at asc
      limit ?
    `,
    [userId, limit],
  );

  return rows.map(mapLocalImageRow);
}

export async function actionMarkLocalImageSyncing(id: string, userId: string) {
  await sqlite.runAsync(
    `
      update image
      set
        sync_status = ?,
        sync_error = ?,
        updated_at = ?
      where id = ? and user_id = ?
    `,
    ["syncing", null, new Date().toISOString(), id, userId],
  );
}

export async function actionMarkLocalImageStorageUploaded(
  id: string,
  userId: string,
  storageBucket: string,
  storagePath: string,
) {
  await sqlite.runAsync(
    `
      update image
      set
        storage_bucket = ?,
        storage_path = ?,
        updated_at = ?
      where id = ? and user_id = ?
    `,
    [storageBucket, storagePath, new Date().toISOString(), id, userId],
  );
}

export async function actionMarkLocalImageSynced(id: string, userId: string) {
  const now = new Date().toISOString();

  await sqlite.runAsync(
    `
      update image
      set
        sync_status = ?,
        last_synced_at = ?,
        sync_error = ?,
        updated_at = ?
      where id = ? and user_id = ?
    `,
    ["synced", now, null, now, id, userId],
  );
}

export async function actionMarkLocalImageSyncFailed(
  id: string,
  userId: string,
  errorMessage: string,
) {
  await sqlite.runAsync(
    `
      update image
      set
        sync_status = ?,
        sync_error = ?,
        updated_at = ?
      where id = ? and user_id = ?
    `,
    ["failed", errorMessage, new Date().toISOString(), id, userId],
  );
}

export async function actionSyncLocalImage(localImage: LocalImage) {
  await actionMarkLocalImageSyncing(localImage.id, localImage.userId);

  try {
    let storageBucket = localImage.storageBucket;
    let storagePath = localImage.storagePath;

    if (!storageBucket || !storagePath) {
      const uploadResult = await uploadPinImageToStorage({
        tripId: localImage.tripId,
        pinId: localImage.pinId,
        imageId: localImage.id,
        fileName: `${localImage.id}.${localImage.mimeType.split("/")[1] ?? "jpg"}`,
        mimeType: localImage.mimeType,
        localUri: localImage.localUri,
      });

      storageBucket = uploadResult.storageBucket;
      storagePath = uploadResult.storagePath;

      await actionMarkLocalImageStorageUploaded(
        localImage.id,
        localImage.userId,
        storageBucket,
        storagePath,
      );
    }

    await actionUpsertRemoteImageFromLocal({
      id: localImage.id,
      pinId: localImage.pinId,
      tripId: localImage.tripId,
      storageBucket,
      storagePath,
      mimeType: localImage.mimeType,
      width: localImage.width,
      height: localImage.height,
      caption: localImage.caption,
    });

    await actionMarkLocalImageSynced(localImage.id, localImage.userId);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to sync image";
    await actionMarkLocalImageSyncFailed(
      localImage.id,
      localImage.userId,
      message,
    );
    throw error;
  }
}

export async function actionSyncPendingLocalImages(
  userId: string,
  limit = DEFAULT_SYNC_BATCH_SIZE,
) {
  const pendingImages = await actionListPendingLocalImages(userId, limit);

  for (const image of pendingImages) {
    await actionSyncLocalImage(image);
  }

  return {
    processed: pendingImages.length,
    hasMore: pendingImages.length === limit,
  };
}
