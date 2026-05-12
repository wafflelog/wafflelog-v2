import { sqlite } from "@/lib/sqlite/client";
import { buildUUID } from "@/lib/sqlite/utils";
import {
  actionSoftDeleteRemoteDocument,
  actionUpsertRemoteDocumentFromLocal,
} from "@/lib/supabase/actions";
import { uploadTravelDocumentToStorage } from "@/lib/supabase/storage";

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
  deletedAt: string | null;
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

const DEFAULT_SYNC_BATCH_SIZE = 25;

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
  deleted_at: string | null;
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
    deletedAt: row.deleted_at,
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
    deleted_at: null,
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
        sync_error,
        deleted_at
      ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      localDocument.deleted_at,
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
    deleted_at: string | null;
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
        sync_error,
        deleted_at
      from document
      where trip_id = ? and user_id = ? and deleted_at is null
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
    deleted_at: string | null;
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
        sync_error,
        deleted_at
      from document
      where pin_id = ? and user_id = ? and deleted_at is null
      order by created_at desc
    `,
    [pinId, userId],
  );

  return rows.map(mapLocalDocumentRow);
}

export async function actionListPendingLocalDocuments(
  userId: string,
  limit = DEFAULT_SYNC_BATCH_SIZE,
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
    deleted_at: string | null;
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
        sync_error,
        deleted_at
      from document
      where user_id = ? and sync_status != 'synced'
      order by created_at asc
      limit ?
    `,
    [userId, limit],
  );

  return rows.map(mapLocalDocumentRow);
}

export async function actionSoftDeleteLocalDocument(
  id: string,
  userId: string,
) {
  const now = new Date().toISOString();

  await sqlite.runAsync(
    `
      update document
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

export async function actionHardDeleteLocalDocument(
  id: string,
  userId: string,
) {
  await sqlite.runAsync(
    `
      delete from document
      where id = ? and user_id = ?
    `,
    [id, userId],
  );
}

export async function actionMarkLocalDocumentSyncing(id: string, userId: string) {
  await sqlite.runAsync(
    `
      update document
      set
        sync_status = ?,
        sync_error = ?,
        updated_at = ?
      where id = ? and user_id = ?
    `,
    ["syncing", null, new Date().toISOString(), id, userId],
  );
}

export async function actionMarkLocalDocumentStorageUploaded(
  id: string,
  userId: string,
  storageBucket: string,
  storagePath: string,
) {
  await sqlite.runAsync(
    `
      update document
      set
        storage_bucket = ?,
        storage_path = ?,
        updated_at = ?
      where id = ? and user_id = ?
    `,
    [storageBucket, storagePath, new Date().toISOString(), id, userId],
  );
}

export async function actionMarkLocalDocumentSynced(id: string, userId: string) {
  const now = new Date().toISOString();

  await sqlite.runAsync(
    `
      update document
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

export async function actionMarkLocalDocumentSyncFailed(
  id: string,
  userId: string,
  errorMessage: string,
) {
  await sqlite.runAsync(
    `
      update document
      set
        sync_status = ?,
        sync_error = ?,
        updated_at = ?
      where id = ? and user_id = ?
    `,
    ["failed", errorMessage, new Date().toISOString(), id, userId],
  );
}

export async function actionSyncLocalDocument(localDocument: LocalDocument) {
  if (localDocument.deletedAt) {
    if (!localDocument.lastSyncedAt) {
      await actionHardDeleteLocalDocument(
        localDocument.id,
        localDocument.userId,
      );
      return;
    }

    await actionMarkLocalDocumentSyncing(
      localDocument.id,
      localDocument.userId,
    );

    try {
      await actionSoftDeleteRemoteDocument(localDocument.id);
      await actionHardDeleteLocalDocument(
        localDocument.id,
        localDocument.userId,
      );
      return;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete document";
      await actionMarkLocalDocumentSyncFailed(
        localDocument.id,
        localDocument.userId,
        message,
      );
      throw error;
    }
  }

  await actionMarkLocalDocumentSyncing(localDocument.id, localDocument.userId);

  try {
    let storageBucket = localDocument.storageBucket;
    let storagePath = localDocument.storagePath;

    if (!storageBucket || !storagePath) {
      if (!localDocument.localUri) {
        throw new Error("Local document file not found");
      }

      const uploadResult = await uploadTravelDocumentToStorage({
        tripId: localDocument.tripId,
        documentId: localDocument.id,
        fileName: localDocument.fileName,
        mimeType: localDocument.mimeType,
        localUri: localDocument.localUri,
      });

      storageBucket = uploadResult.storageBucket;
      storagePath = uploadResult.storagePath;

      await actionMarkLocalDocumentStorageUploaded(
        localDocument.id,
        localDocument.userId,
        storageBucket,
        storagePath,
      );
    }

    await actionUpsertRemoteDocumentFromLocal({
      id: localDocument.id,
      tripId: localDocument.tripId,
      pinId: localDocument.pinId,
      fileName: localDocument.fileName,
      mimeType: localDocument.mimeType,
      storageBucket,
      storagePath,
      caption: localDocument.caption,
    });

    await actionMarkLocalDocumentSynced(localDocument.id, localDocument.userId);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to sync document";
    await actionMarkLocalDocumentSyncFailed(
      localDocument.id,
      localDocument.userId,
      message,
    );
    throw error;
  }
}

export async function actionSyncPendingLocalDocuments(
  userId: string,
  limit = DEFAULT_SYNC_BATCH_SIZE,
) {
  const pendingDocuments = await actionListPendingLocalDocuments(userId, limit);

  for (const document of pendingDocuments) {
    await actionSyncLocalDocument(document);
  }

  return {
    processed: pendingDocuments.length,
    hasMore: pendingDocuments.length === limit,
  };
}
