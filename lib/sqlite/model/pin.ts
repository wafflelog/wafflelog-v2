import { actionUpsertRemotePinFromLocal } from "@/lib/supabase/actions";
import { sqlite } from "../client";

export type LocalPin = {
  id: string;
  tripId: string;
  userId: string;
  name: string;
  date: string;
  time: string;
  categoryId: string;
  createdAt: string;
  updatedAt: string;
  syncStatus: string;
  lastSyncedAt: string | null;
  syncError: string | null;
};

export type CreateLocalPinInput = {
  tripId: string;
  userId: string;
  name: string;
  date: string;
  time: string;
  categoryId: string;
};

function createLocalId() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

function mapLocalPinRow(row: {
  id: string;
  trip_id: string;
  user_id: string;
  name: string;
  date: string;
  time: string;
  category_id: string;
  created_at: string;
  updated_at: string;
  sync_status: string;
  last_synced_at: string | null;
  sync_error: string | null;
}): LocalPin {
  return {
    id: row.id,
    tripId: row.trip_id,
    userId: row.user_id,
    name: row.name,
    date: row.date,
    time: row.time,
    categoryId: row.category_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    syncStatus: row.sync_status,
    lastSyncedAt: row.last_synced_at,
    syncError: row.sync_error,
  };
}

export async function actionCreateLocalPin(input: CreateLocalPinInput) {
  const now = new Date().toISOString();
  const localPin = {
    id: createLocalId(),
    trip_id: input.tripId,
    user_id: input.userId,
    name: input.name.trim(),
    date: input.date,
    time: input.time.trim(),
    category_id: input.categoryId,
    created_at: now,
    updated_at: now,
    sync_status: "pending",
    last_synced_at: null,
    sync_error: null,
  };

  await sqlite.runAsync(
    `
      insert into pin (
        id,
        trip_id,
        user_id,
        name,
        date,
        time,
        category_id,
        created_at,
        updated_at,
        sync_status,
        last_synced_at,
        sync_error
      ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      localPin.id,
      localPin.trip_id,
      localPin.user_id,
      localPin.name,
      localPin.date,
      localPin.time,
      localPin.category_id,
      localPin.created_at,
      localPin.updated_at,
      localPin.sync_status,
      localPin.last_synced_at,
      localPin.sync_error,
    ],
  );

  return mapLocalPinRow(localPin);
}

export async function actionListLocalPins(tripId: string, userId: string) {
  const rows = await sqlite.getAllAsync<{
    id: string;
    trip_id: string;
    user_id: string;
    name: string;
    date: string;
    time: string;
    category_id: string;
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
        name,
        date,
        time,
        category_id,
        created_at,
        updated_at,
        sync_status,
        last_synced_at,
        sync_error
      from pin
      where trip_id = ? and user_id = ?
      order by date asc, time asc, created_at asc
    `,
    [tripId, userId],
  );

  return rows.map(mapLocalPinRow);
}

export async function actionListLocalPinsByTripAndDate(
  tripId: string,
  userId: string,
  date: string,
) {
  const rows = await sqlite.getAllAsync<{
    id: string;
    trip_id: string;
    user_id: string;
    name: string;
    date: string;
    time: string;
    category_id: string;
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
        name,
        date,
        time,
        category_id,
        created_at,
        updated_at,
        sync_status,
        last_synced_at,
        sync_error
      from pin
      where trip_id = ? and user_id = ? and date = ?
      order by time asc, created_at asc
    `,
    [tripId, userId, date],
  );

  return rows.map(mapLocalPinRow);
}

export async function actionGetLocalPin(id: string, userId: string) {
  const row = await sqlite.getFirstAsync<{
    id: string;
    trip_id: string;
    user_id: string;
    name: string;
    date: string;
    time: string;
    category_id: string;
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
        name,
        date,
        time,
        category_id,
        created_at,
        updated_at,
        sync_status,
        last_synced_at,
        sync_error
      from pin
      where id = ? and user_id = ?
      limit 1
    `,
    [id, userId],
  );

  return row ? mapLocalPinRow(row) : null;
}

export async function actionListPendingLocalPins(userId: string) {
  const rows = await sqlite.getAllAsync<{
    id: string;
    trip_id: string;
    user_id: string;
    name: string;
    date: string;
    time: string;
    category_id: string;
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
        name,
        date,
        time,
        category_id,
        created_at,
        updated_at,
        sync_status,
        last_synced_at,
        sync_error
      from pin
      where user_id = ? and sync_status != 'synced'
      order by created_at asc
    `,
    [userId],
  );

  return rows.map(mapLocalPinRow);
}

export async function actionMarkLocalPinSyncing(id: string, userId: string) {
  await sqlite.runAsync(
    `
      update pin
      set
        sync_status = ?,
        sync_error = ?,
        updated_at = ?
      where id = ? and user_id = ?
    `,
    ["syncing", null, new Date().toISOString(), id, userId],
  );
}

export async function actionMarkLocalPinSynced(id: string, userId: string) {
  const now = new Date().toISOString();

  await sqlite.runAsync(
    `
      update pin
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

export async function actionMarkLocalPinSyncFailed(
  id: string,
  userId: string,
  errorMessage: string,
) {
  await sqlite.runAsync(
    `
      update pin
      set
        sync_status = ?,
        sync_error = ?,
        updated_at = ?
      where id = ? and user_id = ?
    `,
    ["failed", errorMessage, new Date().toISOString(), id, userId],
  );
}

export async function actionSyncLocalPin(localPin: LocalPin) {
  await actionMarkLocalPinSyncing(localPin.id, localPin.userId);

  try {
    await actionUpsertRemotePinFromLocal({
      id: localPin.id,
      tripId: localPin.tripId,
      name: localPin.name,
      date: localPin.date,
      time: localPin.time,
      categoryId: localPin.categoryId,
    });

    await actionMarkLocalPinSynced(localPin.id, localPin.userId);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to sync pin";
    await actionMarkLocalPinSyncFailed(localPin.id, localPin.userId, message);
    throw error;
  }
}

export async function actionSyncPendingLocalPins(userId: string) {
  const pendingPins = await actionListPendingLocalPins(userId);

  for (const pin of pendingPins) {
    await actionSyncLocalPin(pin);
  }
}
