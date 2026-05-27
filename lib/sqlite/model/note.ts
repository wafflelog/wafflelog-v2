import { sqlite } from "@/lib/sqlite/client";
import { buildUUID } from "@/lib/sqlite/utils";
import {
  actionSoftDeleteRemoteNote,
  actionUpsertRemoteNoteFromLocal,
} from "@/lib/supabase/actions";

export type LocalNote = {
  id: string;
  tripId: string;
  pinId: string | null;
  userId: string;
  text: string;
  createdAt: string;
  updatedAt: string;
  syncStatus: string;
  lastSyncedAt: string | null;
  syncError: string | null;
  deletedAt: string | null;
};

export type CreateLocalNoteInput = {
  tripId?: string;
  pinId?: string | null;
  userId: string;
  text: string;
};

const DEFAULT_SYNC_BATCH_SIZE = 25;

function mapLocalNoteRow(row: {
  id: string;
  trip_id: string;
  pin_id: string | null;
  user_id: string;
  text: string;
  created_at: string;
  updated_at: string;
  sync_status: string;
  last_synced_at: string | null;
  sync_error: string | null;
  deleted_at: string | null;
}): LocalNote {
  return {
    id: row.id,
    tripId: row.trip_id,
    pinId: row.pin_id,
    userId: row.user_id,
    text: row.text,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    syncStatus: row.sync_status,
    lastSyncedAt: row.last_synced_at,
    syncError: row.sync_error,
    deletedAt: row.deleted_at,
  };
}

export async function actionCreateLocalNote(input: CreateLocalNoteInput) {
  const now = new Date().toISOString();
  const normalizedText = input.text.trim();

  if (!normalizedText) {
    throw new Error("Note cannot be empty");
  }

  let tripId = input.tripId;

  if (!tripId && input.pinId) {
    const pin = await sqlite.getFirstAsync<{ trip_id: string }>(
      `
        select trip_id
        from pin
        where id = ? and user_id = ? and deleted_at is null
        limit 1
      `,
      [input.pinId, input.userId],
    );

    tripId = pin?.trip_id;
  }

  if (!tripId) {
    throw new Error("Trip is required to save note");
  }

  const localNote = {
    id: buildUUID(),
    trip_id: tripId,
    pin_id: input.pinId ?? null,
    user_id: input.userId,
    text: normalizedText,
    created_at: now,
    updated_at: now,
    sync_status: "pending",
    last_synced_at: null,
    sync_error: null,
    deleted_at: null,
  };

  await sqlite.runAsync(
    `
      insert into note (
        id,
        trip_id,
        pin_id,
        user_id,
        text,
        created_at,
        updated_at,
        sync_status,
        last_synced_at,
        sync_error,
        deleted_at
      ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      localNote.id,
      localNote.trip_id,
      localNote.pin_id,
      localNote.user_id,
      localNote.text,
      localNote.created_at,
      localNote.updated_at,
      localNote.sync_status,
      localNote.last_synced_at,
      localNote.sync_error,
      localNote.deleted_at,
    ],
  );

  return mapLocalNoteRow(localNote);
}

export async function actionListLocalNotesByPin(pinId: string, userId: string) {
  const rows = await sqlite.getAllAsync<{
    id: string;
    trip_id: string;
    pin_id: string | null;
    user_id: string;
    text: string;
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
        text,
        created_at,
        updated_at,
        sync_status,
        last_synced_at,
        sync_error,
        deleted_at
      from note
      where pin_id = ? and user_id = ? and deleted_at is null
      order by created_at desc
    `,
    [pinId, userId],
  );

  return rows.map(mapLocalNoteRow);
}

export async function actionListLocalNotesByTrip(tripId: string, userId: string) {
  const rows = await sqlite.getAllAsync<{
    id: string;
    trip_id: string;
    pin_id: string | null;
    user_id: string;
    text: string;
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
        text,
        created_at,
        updated_at,
        sync_status,
        last_synced_at,
        sync_error,
        deleted_at
      from note
      where trip_id = ? and pin_id is null and user_id = ? and deleted_at is null
      order by created_at desc
    `,
    [tripId, userId],
  );

  return rows.map(mapLocalNoteRow);
}

export async function actionListPendingLocalNotes(
  userId: string,
  limit = DEFAULT_SYNC_BATCH_SIZE,
) {
  const rows = await sqlite.getAllAsync<{
    id: string;
    trip_id: string;
    pin_id: string | null;
    user_id: string;
    text: string;
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
        text,
        created_at,
        updated_at,
        sync_status,
        last_synced_at,
        sync_error,
        deleted_at
      from note
      where user_id = ? and sync_status != 'synced'
      order by created_at asc
      limit ?
    `,
    [userId, limit],
  );

  return rows.map(mapLocalNoteRow);
}

export async function actionSoftDeleteLocalNote(id: string, userId: string) {
  const now = new Date().toISOString();

  await sqlite.runAsync(
    `
      update note
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

export async function actionHardDeleteLocalNote(id: string, userId: string) {
  await sqlite.runAsync(
    `
      delete from note
      where id = ? and user_id = ?
    `,
    [id, userId],
  );
}

export async function actionMarkLocalNoteSyncing(id: string, userId: string) {
  await sqlite.runAsync(
    `
      update note
      set
        sync_status = ?,
        sync_error = ?,
        updated_at = ?
      where id = ? and user_id = ?
    `,
    ["syncing", null, new Date().toISOString(), id, userId],
  );
}

export async function actionMarkLocalNoteSynced(id: string, userId: string) {
  const now = new Date().toISOString();

  await sqlite.runAsync(
    `
      update note
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

export async function actionMarkLocalNoteSyncFailed(
  id: string,
  userId: string,
  errorMessage: string,
) {
  await sqlite.runAsync(
    `
      update note
      set
        sync_status = ?,
        sync_error = ?,
        updated_at = ?
      where id = ? and user_id = ?
    `,
    ["failed", errorMessage, new Date().toISOString(), id, userId],
  );
}

export async function actionSyncLocalNote(localNote: LocalNote) {
  if (localNote.deletedAt) {
    if (!localNote.lastSyncedAt) {
      await actionHardDeleteLocalNote(localNote.id, localNote.userId);
      return;
    }

    await actionMarkLocalNoteSyncing(localNote.id, localNote.userId);

    try {
      await actionSoftDeleteRemoteNote(localNote.id);
      await actionHardDeleteLocalNote(localNote.id, localNote.userId);
      return;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete note";
      await actionMarkLocalNoteSyncFailed(
        localNote.id,
        localNote.userId,
        message,
      );
      throw error;
    }
  }

  await actionMarkLocalNoteSyncing(localNote.id, localNote.userId);

  try {
    await actionUpsertRemoteNoteFromLocal({
      id: localNote.id,
      tripId: localNote.tripId,
      pinId: localNote.pinId,
      text: localNote.text,
    });

    await actionMarkLocalNoteSynced(localNote.id, localNote.userId);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to sync note";
    await actionMarkLocalNoteSyncFailed(localNote.id, localNote.userId, message);
    throw error;
  }
}

export async function actionSyncPendingLocalNotes(
  userId: string,
  limit = DEFAULT_SYNC_BATCH_SIZE,
) {
  const pendingNotes = await actionListPendingLocalNotes(userId, limit);

  for (const note of pendingNotes) {
    await actionSyncLocalNote(note);
  }

  return {
    processed: pendingNotes.length,
    hasMore: pendingNotes.length === limit,
  };
}
