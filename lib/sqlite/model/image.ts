import { sqlite } from "@/lib/sqlite/client";
import { buildUUID } from "@/lib/sqlite/utils";

export type LocalImage = {
  id: string;
  pinId: string;
  tripId: string;
  userId: string;
  localUri: string;
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
  mimeType: string;
  width: number;
  height: number;
  caption?: string;
};

function mapLocalImageRow(row: {
  id: string;
  pin_id: string;
  trip_id: string;
  user_id: string;
  local_uri: string;
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
