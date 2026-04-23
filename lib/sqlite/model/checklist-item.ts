import { sqlite } from "../client";

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

function createLocalId() {
  return `checklist_item_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

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
    id: createLocalId(),
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
        updated_at = ?
      where id = ?
    `,
    [new Date().toISOString(), id],
  );
}
