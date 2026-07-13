import { sqlite } from "@/lib/sqlite/client";
import { buildUUID } from "@/lib/sqlite/utils";
import {
  actionSoftDeleteRemoteChecklistItem,
  actionUpdateRemoteChecklistItemFromLocal,
  actionUpsertRemoteChecklistItemFromLocal,
} from "@/lib/supabase/actions";
import { type CreatorAttribution } from "./user-profile";

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
  deletedAt: string | null;
  creator: CreatorAttribution;
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
  deleted_at: string | null;
  creator_username?: string | null;
}, currentUserId?: string): LocalChecklistItem {
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
    deletedAt: row.deleted_at,
    creator: {
      userId: row.user_id,
      username: row.creator_username ?? null,
      isCurrentUser: row.user_id === currentUserId,
    },
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
    deleted_at: null,
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
        sync_error,
        deleted_at
      ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      localChecklistItem.deleted_at,
    ],
  );

  return mapLocalChecklistItemRow(localChecklistItem, input.userId);
}

export async function actionListLocalChecklistItems(
  tripId: string,
  _userId: string,
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
    deleted_at: string | null;
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
        sync_error,
        deleted_at,
        user_profile.username as creator_username
      from checklist_item
      left join user_profile
        on user_profile.id = checklist_item.user_id
      where trip_id = ? and deleted_at is null
      order by created_at asc
    `,
    [tripId],
  );

  return rows.map((row) => mapLocalChecklistItemRow(row, _userId));
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

export async function actionSoftDeleteLocalChecklistItem(
  id: string,
  userId: string,
) {
  const now = new Date().toISOString();

  await sqlite.runAsync(
    `
      update checklist_item
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

export async function actionHardDeleteLocalChecklistItem(
  id: string,
  userId: string,
) {
  await sqlite.runAsync(
    `
      delete from checklist_item
      where id = ? and user_id = ?
    `,
    [id, userId],
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
    deleted_at: string | null;
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
        sync_error,
        deleted_at
      from checklist_item
      where sync_status != 'synced'
        and (
          user_id = ?
          or exists (
            select 1
            from trip_membership
            where trip_membership.trip_id = checklist_item.trip_id
              and trip_membership.user_id = ?
              and trip_membership.status = 'active'
          )
        )
      order by created_at asc
      limit ?
    `,
    [userId, userId, limit],
  );

  return rows.map((row) => mapLocalChecklistItemRow(row, userId));
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
  if (localChecklistItem.deletedAt) {
    if (!localChecklistItem.lastSyncedAt) {
      await actionHardDeleteLocalChecklistItem(
        localChecklistItem.id,
        localChecklistItem.userId,
      );
      return;
    }

    await actionMarkLocalChecklistItemSyncing(
      localChecklistItem.id,
      localChecklistItem.userId,
    );

    try {
      await actionSoftDeleteRemoteChecklistItem(localChecklistItem.id);
      await actionHardDeleteLocalChecklistItem(
        localChecklistItem.id,
        localChecklistItem.userId,
      );
      return;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to delete checklist item";
      await actionMarkLocalChecklistItemSyncFailed(
        localChecklistItem.id,
        localChecklistItem.userId,
        message,
      );
      throw error;
    }
  }

  await actionMarkLocalChecklistItemSyncing(
    localChecklistItem.id,
    localChecklistItem.userId,
  );

  try {
    const syncRemoteChecklistItem = localChecklistItem.lastSyncedAt
      ? actionUpdateRemoteChecklistItemFromLocal
      : actionUpsertRemoteChecklistItemFromLocal;

    await syncRemoteChecklistItem({
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
