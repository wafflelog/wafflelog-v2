import { sqlite } from "@/lib/sqlite/client";
import { buildUUID } from "@/lib/sqlite/utils";
import {
  actionSoftDeleteRemoteTrip,
  actionUpsertRemoteTripFromLocal,
} from "@/lib/supabase/actions";

export type CreateLocalTripInput = {
  userId: string;
  title: string;
  startDate: string;
  endDate: string;
};

export type UpdateLocalTripInput = {
  id: string;
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
  deletedAt: string | null;
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
  deleted_at: string | null;
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
    deletedAt: row.deleted_at,
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
    deleted_at: null,
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
        sync_error,
        deleted_at
      ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      localTrip.deleted_at,
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
    deleted_at: string | null;
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
        sync_error,
        deleted_at
      from trip
      where user_id = ? and deleted_at is null
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
    deleted_at: string | null;
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
        sync_error,
        deleted_at
      from trip
      where id = ? and user_id = ? and deleted_at is null
      limit 1
    `,
    [id, userId],
  );

  return row ? mapLocalTripRow(row) : null;
}

export async function actionListLocalPinsOutsideTripDateRange(
  tripId: string,
  userId: string,
  startDate: string,
  endDate: string,
) {
  return sqlite.getAllAsync<{
    id: string;
    name: string;
    date: string;
  }>(
    `
      select
        id,
        name,
        date
      from pin
      where trip_id = ?
        and user_id = ?
        and deleted_at is null
        and (date < ? or date > ?)
      order by date asc, time asc, created_at asc
    `,
    [tripId, userId, startDate, endDate],
  );
}

export async function actionUpdateLocalTrip(input: UpdateLocalTripInput) {
  const outsidePins = await actionListLocalPinsOutsideTripDateRange(
    input.id,
    input.userId,
    input.startDate,
    input.endDate,
  );

  if (outsidePins.length > 0) {
    throw new Error(
      "Move or delete pins outside the new trip dates before changing this trip period.",
    );
  }

  const now = new Date().toISOString();

  await sqlite.runAsync(
    `
      update trip
      set
        title = ?,
        start_date = ?,
        end_date = ?,
        updated_at = ?,
        sync_status = ?,
        sync_error = ?
      where id = ? and user_id = ? and deleted_at is null
    `,
    [
      input.title.trim(),
      input.startDate,
      input.endDate,
      now,
      "pending",
      null,
      input.id,
      input.userId,
    ],
  );

  const updatedTrip = await actionGetLocalTrip(input.id, input.userId);

  if (!updatedTrip) {
    throw new Error("Trip not found");
  }

  return updatedTrip;
}

export async function actionUpsertLocalTripFromRemote(remoteTrip: {
  id: string;
  userId: string;
  title: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}) {
  const now = new Date().toISOString();

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
        sync_error,
        deleted_at
      ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      on conflict(id) do update set
        user_id = excluded.user_id,
        title = excluded.title,
        start_date = excluded.start_date,
        end_date = excluded.end_date,
        created_at = excluded.created_at,
        updated_at = excluded.updated_at,
        sync_status = excluded.sync_status,
        last_synced_at = excluded.last_synced_at,
        sync_error = excluded.sync_error,
        deleted_at = excluded.deleted_at
    `,
    [
      remoteTrip.id,
      remoteTrip.userId,
      remoteTrip.title,
      remoteTrip.startDate,
      remoteTrip.endDate,
      remoteTrip.createdAt,
      remoteTrip.updatedAt,
      "synced",
      now,
      null,
      null,
    ],
  );
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
    deleted_at: string | null;
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
        sync_error,
        deleted_at
      from trip
      where user_id = ? and sync_status != 'synced'
      order by created_at asc
      limit ?
    `,
    [userId, limit],
  );

  return rows.map(mapLocalTripRow);
}

export async function actionSoftDeleteLocalTrip(id: string, userId: string) {
  const now = new Date().toISOString();

  await sqlite.withTransactionAsync(async () => {
    const softDeleteByTripId = ["checklist_item", "expense", "image", "document"];

    for (const tableName of softDeleteByTripId) {
      await sqlite.runAsync(
        `
          update ${tableName}
          set
            deleted_at = ?,
            sync_status = ?,
            sync_error = ?,
            updated_at = ?
          where trip_id = ? and user_id = ? and deleted_at is null
        `,
        [now, "pending", null, now, id, userId],
      );
    }

    const softDeleteByTripPinId = ["note", "reference_link"];

    for (const tableName of softDeleteByTripPinId) {
      await sqlite.runAsync(
        `
          update ${tableName}
          set
            deleted_at = ?,
            sync_status = ?,
            sync_error = ?,
            updated_at = ?
          where pin_id in (
            select id
            from pin
            where trip_id = ? and user_id = ?
          )
            and user_id = ?
            and deleted_at is null
        `,
        [now, "pending", null, now, id, userId, userId],
      );
    }

    await sqlite.runAsync(
      `
        delete from pin_location
        where pin_id in (
          select id
          from pin
          where trip_id = ? and user_id = ?
        )
          and user_id = ?
      `,
      [id, userId, userId],
    );

    await sqlite.runAsync(
      `
        update pin
        set
          deleted_at = ?,
          sync_status = ?,
          sync_error = ?,
          updated_at = ?
        where trip_id = ? and user_id = ? and deleted_at is null
      `,
      [now, "pending", null, now, id, userId],
    );

    await sqlite.runAsync(
      `
        update trip
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

export async function actionHardDeleteLocalTrip(id: string, userId: string) {
  await sqlite.runAsync(
    `
      delete from trip
      where id = ? and user_id = ?
    `,
    [id, userId],
  );
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
  if (localTrip.deletedAt) {
    if (!localTrip.lastSyncedAt) {
      await actionHardDeleteLocalTrip(localTrip.id, localTrip.userId);
      return;
    }

    await actionMarkLocalTripSyncing(localTrip.id, localTrip.userId);

    try {
      await actionSoftDeleteRemoteTrip(localTrip.id);
      await actionHardDeleteLocalTrip(localTrip.id, localTrip.userId);
      return;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete trip";
      await actionMarkLocalTripSyncFailed(localTrip.id, localTrip.userId, message);
      throw error;
    }
  }

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
