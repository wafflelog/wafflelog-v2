import { sqlite } from "@/lib/sqlite/client";
import { buildUUID } from "@/lib/sqlite/utils";
import {
  actionSoftDeleteRemotePin,
  actionUpsertRemotePinFromLocal,
} from "@/lib/supabase/actions";

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
  deletedAt: string | null;
};

export type CreateLocalPinInput = {
  tripId: string;
  userId: string;
  name: string;
  date: string;
  time: string;
  categoryId: string;
};

export type UpdateLocalPinInput = {
  id: string;
  userId: string;
  name: string;
  date: string;
  time: string;
  categoryId: string;
};

const DEFAULT_SYNC_BATCH_SIZE = 25;

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
  deleted_at: string | null;
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
    deletedAt: row.deleted_at,
  };
}

export async function actionCreateLocalPin(input: CreateLocalPinInput) {
  const now = new Date().toISOString();
  const localPin = {
    id: buildUUID(),
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
    deleted_at: null,
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
        sync_error,
        deleted_at
      ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      localPin.deleted_at,
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
    deleted_at: string | null;
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
        sync_error,
        deleted_at
      from pin
      where trip_id = ? and user_id = ? and deleted_at is null
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
    deleted_at: string | null;
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
        sync_error,
        deleted_at
      from pin
      where trip_id = ? and user_id = ? and date = ? and deleted_at is null
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
    deleted_at: string | null;
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
        sync_error,
        deleted_at
      from pin
      where id = ? and user_id = ? and deleted_at is null
      limit 1
    `,
    [id, userId],
  );

  return row ? mapLocalPinRow(row) : null;
}

export async function actionUpdateLocalPin(input: UpdateLocalPinInput) {
  const now = new Date().toISOString();

  await sqlite.runAsync(
    `
      update pin
      set
        name = ?,
        date = ?,
        time = ?,
        category_id = ?,
        updated_at = ?,
        sync_status = ?,
        sync_error = ?
      where id = ? and user_id = ? and deleted_at is null
    `,
    [
      input.name.trim(),
      input.date,
      input.time.trim(),
      input.categoryId,
      now,
      "pending",
      null,
      input.id,
      input.userId,
    ],
  );

  const updatedPin = await actionGetLocalPin(input.id, input.userId);

  if (!updatedPin) {
    throw new Error("Pin not found");
  }

  return updatedPin;
}

export async function actionUpsertLocalPinFromRemote(remotePin: {
  id: string;
  tripId: string;
  userId: string;
  name: string;
  date: string;
  time: string;
  categoryId: string;
  createdAt: string;
  updatedAt: string;
}) {
  const now = new Date().toISOString();

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
        sync_error,
        deleted_at
      ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      on conflict(id) do update set
        trip_id = excluded.trip_id,
        user_id = excluded.user_id,
        name = excluded.name,
        date = excluded.date,
        time = excluded.time,
        category_id = excluded.category_id,
        created_at = excluded.created_at,
        updated_at = excluded.updated_at,
        sync_status = excluded.sync_status,
        last_synced_at = excluded.last_synced_at,
        sync_error = excluded.sync_error,
        deleted_at = excluded.deleted_at
    `,
    [
      remotePin.id,
      remotePin.tripId,
      remotePin.userId,
      remotePin.name,
      remotePin.date,
      remotePin.time,
      remotePin.categoryId,
      remotePin.createdAt,
      remotePin.updatedAt,
      "synced",
      now,
      null,
      null,
    ],
  );
}

export async function actionListPendingLocalPins(
  userId: string,
  limit = DEFAULT_SYNC_BATCH_SIZE,
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
    deleted_at: string | null;
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
        sync_error,
        deleted_at
      from pin
      where user_id = ? and sync_status != 'synced'
      order by created_at asc
      limit ?
    `,
    [userId, limit],
  );

  return rows.map(mapLocalPinRow);
}

export async function actionSoftDeleteLocalPin(id: string, userId: string) {
  const now = new Date().toISOString();

  await sqlite.withTransactionAsync(async () => {
    const softDeleteByPinId = [
      "note",
      "reference_link",
      "expense",
      "image",
      "document",
    ];

    for (const tableName of softDeleteByPinId) {
      await sqlite.runAsync(
        `
          update ${tableName}
          set
            deleted_at = ?,
            sync_status = ?,
            sync_error = ?,
            updated_at = ?
          where pin_id = ? and user_id = ? and deleted_at is null
        `,
        [now, "pending", null, now, id, userId],
      );
    }

    await sqlite.runAsync(
      `
        delete from pin_location
        where pin_id = ? and user_id = ?
      `,
      [id, userId],
    );

    await sqlite.runAsync(
      `
        update pin
        set
          deleted_at = ?,
          sync_status = ?,
          sync_error = ?,
          updated_at = ?
        where id = ? and user_id = ?
      `,
      [now, "pending", null, now, id, userId],
    );
  });
}

export async function actionHardDeleteLocalPin(id: string, userId: string) {
  await sqlite.runAsync(
    `
      delete from pin
      where id = ? and user_id = ?
    `,
    [id, userId],
  );
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
  if (localPin.deletedAt) {
    if (!localPin.lastSyncedAt) {
      await actionHardDeleteLocalPin(localPin.id, localPin.userId);
      return;
    }

    await actionMarkLocalPinSyncing(localPin.id, localPin.userId);

    try {
      await actionSoftDeleteRemotePin(localPin.id);
      await actionHardDeleteLocalPin(localPin.id, localPin.userId);
      return;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete pin";
      await actionMarkLocalPinSyncFailed(localPin.id, localPin.userId, message);
      throw error;
    }
  }

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
    const message =
      error instanceof Error ? error.message : "Failed to sync pin";
    await actionMarkLocalPinSyncFailed(localPin.id, localPin.userId, message);
    throw error;
  }
}

export async function actionSyncPendingLocalPins(
  userId: string,
  limit = DEFAULT_SYNC_BATCH_SIZE,
) {
  const pendingPins = await actionListPendingLocalPins(userId, limit);

  for (const pin of pendingPins) {
    await actionSyncLocalPin(pin);
  }

  return {
    processed: pendingPins.length,
    hasMore: pendingPins.length === limit,
  };
}
