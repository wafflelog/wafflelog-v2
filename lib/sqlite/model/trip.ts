import { sqlite } from "@/lib/sqlite/client";
import { buildUUID } from "@/lib/sqlite/utils";
import { actionUpsertRemoteTripFromLocal } from "@/lib/supabase/actions";

export type CreateLocalTripInput = {
  userId: string;
  title: string;
  startDate: string;
  endDate: string;
};

export type LocalTrip = {
  id: string;
  userId: string;
  title: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
  syncStatus: string;
  lastSyncedAt: string | null;
  syncError: string | null;
};

const DEFAULT_SYNC_BATCH_SIZE = 25;

function mapLocalTripRow(row: {
  id: string;
  user_id: string;
  title: string;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
  sync_status: string;
  last_synced_at: string | null;
  sync_error: string | null;
}): LocalTrip {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    startDate: row.start_date,
    endDate: row.end_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    syncStatus: row.sync_status,
    lastSyncedAt: row.last_synced_at,
    syncError: row.sync_error,
  };
}

export async function actionCreateLocalTrip(input: CreateLocalTripInput) {
  const now = new Date().toISOString();
  const localTrip = {
    id: buildUUID(),
    user_id: input.userId,
    title: input.title.trim(),
    start_date: input.startDate,
    end_date: input.endDate,
    created_at: now,
    updated_at: now,
    sync_status: "pending",
    last_synced_at: null,
    sync_error: null,
  };

  await sqlite.runAsync(
    `
      insert into trip (
        id,
        user_id,
        title,
        start_date,
        end_date,
        created_at,
        updated_at,
        sync_status,
        last_synced_at,
        sync_error
      ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      localTrip.id,
      localTrip.user_id,
      localTrip.title,
      localTrip.start_date,
      localTrip.end_date,
      localTrip.created_at,
      localTrip.updated_at,
      localTrip.sync_status,
      localTrip.last_synced_at,
      localTrip.sync_error,
    ],
  );

  return mapLocalTripRow(localTrip);
}

export async function actionListLocalTrips(userId: string) {
  const rows = await sqlite.getAllAsync<{
    id: string;
    user_id: string;
    title: string;
    start_date: string;
    end_date: string;
    created_at: string;
    updated_at: string;
    sync_status: string;
    last_synced_at: string | null;
    sync_error: string | null;
  }>(
    `
      select
        id,
        user_id,
        title,
        start_date,
        end_date,
        created_at,
        updated_at,
        sync_status,
        last_synced_at,
        sync_error
      from trip
      where user_id = ?
      order by start_date asc, created_at desc
    `,
    [userId],
  );

  return rows.map(mapLocalTripRow);
}

export async function actionGetLocalTrip(id: string, userId: string) {
  const row = await sqlite.getFirstAsync<{
    id: string;
    user_id: string;
    title: string;
    start_date: string;
    end_date: string;
    created_at: string;
    updated_at: string;
    sync_status: string;
    last_synced_at: string | null;
    sync_error: string | null;
  }>(
    `
      select
        id,
        user_id,
        title,
        start_date,
        end_date,
        created_at,
        updated_at,
        sync_status,
        last_synced_at,
        sync_error
      from trip
      where id = ? and user_id = ?
      limit 1
    `,
    [id, userId],
  );

  return row ? mapLocalTripRow(row) : null;
}

export async function actionListPendingLocalTrips(
  userId: string,
  limit = DEFAULT_SYNC_BATCH_SIZE,
) {
  const rows = await sqlite.getAllAsync<{
    id: string;
    user_id: string;
    title: string;
    start_date: string;
    end_date: string;
    created_at: string;
    updated_at: string;
    sync_status: string;
    last_synced_at: string | null;
    sync_error: string | null;
  }>(
    `
      select
        id,
        user_id,
        title,
        start_date,
        end_date,
        created_at,
        updated_at,
        sync_status,
        last_synced_at,
        sync_error
      from trip
      where user_id = ? and sync_status != 'synced'
      order by created_at asc
      limit ?
    `,
    [userId, limit],
  );

  return rows.map(mapLocalTripRow);
}

export async function actionMarkLocalTripSyncing(id: string, userId: string) {
  await sqlite.runAsync(
    `
      update trip
      set
        sync_status = ?,
        sync_error = ?,
        updated_at = ?
      where id = ? and user_id = ?
    `,
    ["syncing", null, new Date().toISOString(), id, userId],
  );
}

export async function actionMarkLocalTripSynced(id: string, userId: string) {
  const now = new Date().toISOString();

  await sqlite.runAsync(
    `
      update trip
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

export async function actionMarkLocalTripSyncFailed(
  id: string,
  userId: string,
  errorMessage: string,
) {
  await sqlite.runAsync(
    `
      update trip
      set
        sync_status = ?,
        sync_error = ?,
        updated_at = ?
      where id = ? and user_id = ?
    `,
    ["failed", errorMessage, new Date().toISOString(), id, userId],
  );
}

export async function actionSyncLocalTrip(localTrip: LocalTrip) {
  await actionMarkLocalTripSyncing(localTrip.id, localTrip.userId);

  try {
    await actionUpsertRemoteTripFromLocal({
      id: localTrip.id,
      title: localTrip.title,
      startDate: localTrip.startDate,
      endDate: localTrip.endDate,
    });

    await actionMarkLocalTripSynced(localTrip.id, localTrip.userId);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to sync trip";
    await actionMarkLocalTripSyncFailed(
      localTrip.id,
      localTrip.userId,
      message,
    );
    throw error;
  }
}

export async function actionSyncPendingLocalTrips(
  userId: string,
  limit = DEFAULT_SYNC_BATCH_SIZE,
) {
  const pendingTrips = await actionListPendingLocalTrips(userId, limit);

  for (const trip of pendingTrips) {
    await actionSyncLocalTrip(trip);
  }

  return {
    processed: pendingTrips.length,
    hasMore: pendingTrips.length === limit,
  };
}
