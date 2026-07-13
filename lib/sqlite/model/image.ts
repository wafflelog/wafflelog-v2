import { sqlite } from "@/lib/sqlite/client";
import { buildUUID } from "@/lib/sqlite/utils";
import {
  actionSoftDeleteRemoteImage,
  actionUpsertRemoteImageFromLocal,
} from "@/lib/supabase/actions";
import { uploadImageToStorage } from "@/lib/media/image";
import { type PinMetadata } from "@/types/pin";

type LocalImagePinSummary = {
  id: string;
  name: string | null;
  categoryId: string;
  metadataJson: PinMetadata;
  location: {
    displayName: string | null;
  } | null;
};

export type LocalImage = {
  id: string;
  pinId: string | null;
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
  deletedAt: string | null;
  pin: LocalImagePinSummary | null;
};

export type CreateLocalImageInput = {
  id?: string;
  pinId?: string | null;
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

function parsePinMetadata(metadata: string | null): PinMetadata {
  if (!metadata) {
    return { version: 1 };
  }

  try {
    const parsed = JSON.parse(metadata) as Partial<PinMetadata>;
    return {
      version: 1,
      departure: parsed.departure,
      destination: parsed.destination,
    };
  } catch {
    return { version: 1 };
  }
}

function mapLocalImageRow(row: {
  id: string;
  pin_id: string | null;
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
  deleted_at: string | null;
  pin_name?: string | null;
  pin_category_id?: string | null;
  pin_metadata_json?: string | null;
  pin_display_name?: string | null;
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
    deletedAt: row.deleted_at,
    pin:
      row.pin_id && row.pin_category_id
        ? {
            id: row.pin_id,
            name: row.pin_name ?? null,
            categoryId: row.pin_category_id,
            metadataJson: parsePinMetadata(row.pin_metadata_json ?? null),
            location: {
              displayName: row.pin_display_name ?? null,
            },
          }
        : null,
  };
}

export async function actionCreateLocalImage(input: CreateLocalImageInput) {
  const now = new Date().toISOString();
  const localImage = {
    id: input.id ?? buildUUID(),
    pin_id: input.pinId ?? null,
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
    deleted_at: null,
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
        sync_error,
        deleted_at
      ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      localImage.deleted_at,
    ],
  );

  return mapLocalImageRow(localImage);
}

export async function actionListLocalImagesByPin(
  pinId: string,
  _userId: string,
) {
  const rows = await sqlite.getAllAsync<{
    id: string;
    pin_id: string | null;
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
    deleted_at: string | null;
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
        sync_error,
        deleted_at
      from image
      where pin_id = ? and deleted_at is null
      order by created_at desc
    `,
    [pinId],
  );

  return rows.map(mapLocalImageRow);
}

export async function actionCountLocalImagesByPin(
  pinId: string,
  _userId: string,
) {
  const row = await sqlite.getFirstAsync<{ total: number }>(
    `
      select count(*) as total
      from image
      where pin_id = ? and deleted_at is null
    `,
    [pinId],
  );

  return row?.total ?? 0;
}

export async function actionListLocalImagesByTrip(
  tripId: string,
  _userId: string,
) {
  const rows = await sqlite.getAllAsync<{
    id: string;
    pin_id: string | null;
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
    deleted_at: string | null;
    pin_name: string | null;
    pin_category_id: string | null;
    pin_metadata_json: string | null;
    pin_display_name: string | null;
  }>(
    `
      select
        image.id,
        image.pin_id,
        image.trip_id,
        image.user_id,
        image.local_uri,
        image.storage_bucket,
        image.storage_path,
        image.mime_type,
        image.width,
        image.height,
        image.caption,
        image.created_at,
        image.updated_at,
        image.sync_status,
        image.last_synced_at,
        image.sync_error,
        image.deleted_at,
        pin.name as pin_name,
        pin.category_id as pin_category_id,
        pin.metadata_json as pin_metadata_json,
        pin_location.display_name as pin_display_name
      from image
      left join pin
        on pin.id = image.pin_id
      left join pin_location
        on pin_location.pin_id = pin.id
      where image.trip_id = ? and image.deleted_at is null
      order by image.created_at desc
    `,
    [tripId],
  );

  return rows.map(mapLocalImageRow);
}

export async function actionListPendingLocalImages(
  userId: string,
  limit = DEFAULT_SYNC_BATCH_SIZE,
) {
  const rows = await sqlite.getAllAsync<{
    id: string;
    pin_id: string | null;
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
    deleted_at: string | null;
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
        sync_error,
        deleted_at
      from image
      where user_id = ? and sync_status != 'synced'
      order by created_at asc
      limit ?
    `,
    [userId, limit],
  );

  return rows.map(mapLocalImageRow);
}

export async function actionSoftDeleteLocalImage(id: string, userId: string) {
  const now = new Date().toISOString();

  await sqlite.runAsync(
    `
      update image
      set
        deleted_at = ?,
        sync_status = ?,
        sync_error = ?,
        updated_at = ?
      where id = ? and user_id = ?
    `,
    [now, "pending", null, now, id, userId],
  );
}

export async function actionHardDeleteLocalImage(id: string, userId: string) {
  await sqlite.runAsync(
    `
      delete from image
      where id = ? and user_id = ?
    `,
    [id, userId],
  );
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
  if (localImage.deletedAt) {
    if (!localImage.lastSyncedAt) {
      await actionHardDeleteLocalImage(localImage.id, localImage.userId);
      return;
    }

    await actionMarkLocalImageSyncing(localImage.id, localImage.userId);

    try {
      await actionSoftDeleteRemoteImage(localImage.id);
      await actionHardDeleteLocalImage(localImage.id, localImage.userId);
      return;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete image";
      await actionMarkLocalImageSyncFailed(
        localImage.id,
        localImage.userId,
        message,
      );
      throw error;
    }
  }

  await actionMarkLocalImageSyncing(localImage.id, localImage.userId);

  try {
    let storageBucket = localImage.storageBucket;
    let storagePath = localImage.storagePath;

    if (!storageBucket || !storagePath) {
      const uploadResult = await uploadImageToStorage({
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
