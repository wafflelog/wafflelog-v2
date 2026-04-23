import { sqlite } from "../client";

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

function createLocalId() {
  return `trip_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

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
    id: createLocalId(),
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
