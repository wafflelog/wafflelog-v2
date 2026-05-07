import { sqlite } from "@/lib/sqlite/client";
import { buildUUID } from "@/lib/sqlite/utils";
import { actionUpsertRemoteChecklistItemFromLocal } from "@/lib/supabase/actions";

export type CreateLocalChecklistItemInput = {
  tripId: string;
  userId: string;
  title: string;
};

export type LocalChecklistItem = {
  id: string;
  tripId: string;
  userId: string;
  title: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
  syncStatus: string;
  lastSyncedAt: string | null;
  syncError: string | null;
};

const DEFAULT_SYNC_BATCH_SIZE = 25;

function mapLocalChecklistItemRow(row: {
  id: string;
  trip_id: string;
  user_id: string;
  title: string;
  completed: number;
  created_at: string;
  updated_at: string;
  sync_status: string;
  last_synced_at: string | null;
  sync_error: string | null;
}): LocalChecklistItem {
  return {
    id: row.id,
    tripId: row.trip_id,
    userId: row.user_id,
    title: row.title,
    completed: Boolean(row.completed),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    syncStatus: row.sync_status,
    lastSyncedAt: row.last_synced_at,
    syncError: row.sync_error,
  };
}

export async function actionCreateLocalChecklistItem(
  input: CreateLocalChecklistItemInput,
) {
  const now = new Date().toISOString();
  const localChecklistItem = {
    id: buildUUID(),
    trip_id: input.tripId,
    user_id: input.userId,
    title: input.title.trim(),
    completed: 0,
    created_at: now,
    updated_at: now,
    sync_status: "pending",
    last_synced_at: null,
    sync_error: null,
  };

  await sqlite.runAsync(
    `
      insert into checklist_item (
        id,
        trip_id,
        user_id,
        title,
        completed,
        created_at,
        updated_at,
        sync_status,
        last_synced_at,
        sync_error
      ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      localChecklistItem.id,
      localChecklistItem.trip_id,
      localChecklistItem.user_id,
      localChecklistItem.title,
      localChecklistItem.completed,
      localChecklistItem.created_at,
      localChecklistItem.updated_at,
      localChecklistItem.sync_status,
      localChecklistItem.last_synced_at,
      localChecklistItem.sync_error,
    ],
  );

  return mapLocalChecklistItemRow(localChecklistItem);
}

export async function actionListLocalChecklistItems(
  tripId: string,
  userId: string,
) {
  const rows = await sqlite.getAllAsync<{
    id: string;
    trip_id: string;
    user_id: string;
    title: string;
    completed: number;
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
        user_id,
        title,
        completed,
        created_at,
        updated_at,
        sync_status,
        last_synced_at,
        sync_error
      from checklist_item
      where trip_id = ? and user_id = ?
      order by created_at asc
    `,
    [tripId, userId],
  );

  return rows.map(mapLocalChecklistItemRow);
}

export async function actionToggleLocalChecklistItemCompleted(id: string) {
  await sqlite.runAsync(
    `
      update checklist_item
      set
        completed = case completed when 1 then 0 else 1 end,
        updated_at = ?,
        sync_status = ?,
        sync_error = ?
      where id = ?
    `,
    [new Date().toISOString(), "pending", null, id],
  );
}

export async function actionListPendingLocalChecklistItems(
  userId: string,
  limit = DEFAULT_SYNC_BATCH_SIZE,
) {
  const rows = await sqlite.getAllAsync<{
    id: string;
    trip_id: string;
    user_id: string;
    title: string;
    completed: number;
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
        user_id,
        title,
        completed,
        created_at,
        updated_at,
        sync_status,
        last_synced_at,
        sync_error
      from checklist_item
      where user_id = ? and sync_status != 'synced'
      order by created_at asc
      limit ?
    `,
    [userId, limit],
  );

  return rows.map(mapLocalChecklistItemRow);
}

export async function actionMarkLocalChecklistItemSyncing(
  id: string,
  userId: string,
) {
  await sqlite.runAsync(
    `
      update checklist_item
      set
        sync_status = ?,
        sync_error = ?,
        updated_at = ?
      where id = ? and user_id = ?
    `,
    ["syncing", null, new Date().toISOString(), id, userId],
  );
}

export async function actionMarkLocalChecklistItemSynced(
  id: string,
  userId: string,
) {
  const now = new Date().toISOString();

  await sqlite.runAsync(
    `
      update checklist_item
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

export async function actionMarkLocalChecklistItemSyncFailed(
  id: string,
  userId: string,
  errorMessage: string,
) {
  await sqlite.runAsync(
    `
      update checklist_item
      set
        sync_status = ?,
        sync_error = ?,
        updated_at = ?
      where id = ? and user_id = ?
    `,
    ["failed", errorMessage, new Date().toISOString(), id, userId],
  );
}

export async function actionSyncLocalChecklistItem(
  localChecklistItem: LocalChecklistItem,
) {
  await actionMarkLocalChecklistItemSyncing(
    localChecklistItem.id,
    localChecklistItem.userId,
  );

  try {
    await actionUpsertRemoteChecklistItemFromLocal({
      id: localChecklistItem.id,
      tripId: localChecklistItem.tripId,
      title: localChecklistItem.title,
      completed: localChecklistItem.completed,
    });

    await actionMarkLocalChecklistItemSynced(
      localChecklistItem.id,
      localChecklistItem.userId,
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to sync checklist item";
    await actionMarkLocalChecklistItemSyncFailed(
      localChecklistItem.id,
      localChecklistItem.userId,
      message,
    );
    throw error;
  }
}

export async function actionSyncPendingLocalChecklistItems(
  userId: string,
  limit = DEFAULT_SYNC_BATCH_SIZE,
) {
  const pendingChecklistItems = await actionListPendingLocalChecklistItems(
    userId,
    limit,
  );

  for (const checklistItem of pendingChecklistItems) {
    await actionSyncLocalChecklistItem(checklistItem);
  }

  return {
    processed: pendingChecklistItems.length,
    hasMore: pendingChecklistItems.length === limit,
  };
}
