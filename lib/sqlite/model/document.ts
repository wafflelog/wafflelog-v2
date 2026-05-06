import { sqlite } from "@/lib/sqlite/client";
import { buildUUID } from "@/lib/sqlite/utils";

export type LocalDocument = {
  id: string;
  tripId: string;
  pinId: string | null;
  userId: string;
  fileName: string;
  mimeType: string;
  localUri: string | null;
  storageBucket: string;
  storagePath: string;
  caption: string | null;
  createdAt: string;
  updatedAt: string;
  syncStatus: string;
  lastSyncedAt: string | null;
  syncError: string | null;
};

export type CreateLocalDocumentInput = {
  id?: string;
  tripId: string;
  pinId?: string | null;
  userId: string;
  fileName: string;
  mimeType: string;
  localUri: string;
  storageBucket?: string;
  storagePath?: string;
  caption?: string;
};

function mapLocalDocumentRow(row: {
  id: string;
  trip_id: string;
  pin_id: string | null;
  user_id: string;
  file_name: string;
  mime_type: string;
  local_uri: string | null;
  storage_bucket: string;
  storage_path: string;
  caption: string | null;
  created_at: string;
  updated_at: string;
  sync_status: string;
  last_synced_at: string | null;
  sync_error: string | null;
}): LocalDocument {
  return {
    id: row.id,
    tripId: row.trip_id,
    pinId: row.pin_id,
    userId: row.user_id,
    fileName: row.file_name,
    mimeType: row.mime_type,
    localUri: row.local_uri,
    storageBucket: row.storage_bucket,
    storagePath: row.storage_path,
    caption: row.caption,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    syncStatus: row.sync_status,
    lastSyncedAt: row.last_synced_at,
    syncError: row.sync_error,
  };
}

export async function actionCreateLocalDocument(
  input: CreateLocalDocumentInput,
) {
  const now = new Date().toISOString();
  const localDocument = {
    id: input.id ?? buildUUID(),
    trip_id: input.tripId,
    pin_id: input.pinId ?? null,
    user_id: input.userId,
    file_name: input.fileName.trim(),
    mime_type: input.mimeType.trim(),
    local_uri: input.localUri.trim(),
    storage_bucket: input.storageBucket?.trim() ?? "",
    storage_path: input.storagePath?.trim() ?? "",
    caption: input.caption?.trim() || null,
    created_at: now,
    updated_at: now,
    sync_status: "pending",
    last_synced_at: null,
    sync_error: null,
  };

  await sqlite.runAsync(
    `
      insert into document (
        id,
        trip_id,
        pin_id,
        user_id,
        file_name,
        mime_type,
        local_uri,
        storage_bucket,
        storage_path,
        caption,
        created_at,
        updated_at,
        sync_status,
        last_synced_at,
        sync_error
      ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      localDocument.id,
      localDocument.trip_id,
      localDocument.pin_id,
      localDocument.user_id,
      localDocument.file_name,
      localDocument.mime_type,
      localDocument.local_uri,
      localDocument.storage_bucket,
      localDocument.storage_path,
      localDocument.caption,
      localDocument.created_at,
      localDocument.updated_at,
      localDocument.sync_status,
      localDocument.last_synced_at,
      localDocument.sync_error,
    ],
  );

  return mapLocalDocumentRow(localDocument);
}

export async function actionListLocalDocumentsByTrip(
  tripId: string,
  userId: string,
) {
  const rows = await sqlite.getAllAsync<{
    id: string;
    trip_id: string;
    pin_id: string | null;
    user_id: string;
    file_name: string;
    mime_type: string;
    local_uri: string | null;
    storage_bucket: string;
    storage_path: string;
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
        trip_id,
        pin_id,
        user_id,
        file_name,
        mime_type,
        local_uri,
        storage_bucket,
        storage_path,
        caption,
        created_at,
        updated_at,
        sync_status,
        last_synced_at,
        sync_error
      from document
      where trip_id = ? and user_id = ?
      order by created_at desc
    `,
    [tripId, userId],
  );

  return rows.map(mapLocalDocumentRow);
}

export async function actionListLocalDocumentsByPin(
  pinId: string,
  userId: string,
) {
  const rows = await sqlite.getAllAsync<{
    id: string;
    trip_id: string;
    pin_id: string | null;
    user_id: string;
    file_name: string;
    mime_type: string;
    local_uri: string | null;
    storage_bucket: string;
    storage_path: string;
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
        trip_id,
        pin_id,
        user_id,
        file_name,
        mime_type,
        local_uri,
        storage_bucket,
        storage_path,
        caption,
        created_at,
        updated_at,
        sync_status,
        last_synced_at,
        sync_error
      from document
      where pin_id = ? and user_id = ?
      order by created_at desc
    `,
    [pinId, userId],
  );

  return rows.map(mapLocalDocumentRow);
}
