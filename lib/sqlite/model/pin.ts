import { sqlite } from "@/lib/sqlite/client";
import { buildUUID } from "@/lib/sqlite/utils";
import {
  actionSoftDeleteRemotePin,
  actionUpsertRemotePinFromLocal,
} from "@/lib/supabase/actions";
import { type PinMetadata } from "@/types/pin";

export type LocalPin = {
  id: string;
  tripId: string;
  userId: string;
  name: string;
  startDate: string;
  startTime: string | null;
  endDate: string;
  endTime: string | null;
  allDay: boolean;
  categoryId: string;
  metadataJson: PinMetadata;
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
  startDate: string;
  startTime: string | null;
  endDate: string;
  endTime: string | null;
  allDay: boolean;
  categoryId: string;
  metadataJson: PinMetadata;
};

export type UpdateLocalPinInput = {
  id: string;
  userId: string;
  name: string;
  startDate: string;
  startTime: string | null;
  endDate: string;
  endTime: string | null;
  allDay: boolean;
  categoryId: string;
  metadataJson: PinMetadata;
};

const DEFAULT_SYNC_BATCH_SIZE = 25;
const DEFAULT_PIN_METADATA: PinMetadata = { version: 1 };

const stringifyMetadata = (metadata: PinMetadata) => JSON.stringify(metadata);

const parseMetadata = (metadata: string | null): PinMetadata => {
  if (!metadata) {
    return DEFAULT_PIN_METADATA;
  }

  try {
    const parsed = JSON.parse(metadata) as Partial<PinMetadata>;
    return {
      version: 1,
      departure: parsed.departure,
      destination: parsed.destination,
      carrier: parsed.carrier,
      reference: parsed.reference,
    };
  } catch {
    return DEFAULT_PIN_METADATA;
  }
};

type LocalPinRow = {
  id: string;
  trip_id: string;
  user_id: string;
  name: string;
  start_date: string;
  start_time: string | null;
  end_date: string;
  end_time: string | null;
  all_day: number;
  category_id: string;
  metadata_json: string | null;
  created_at: string;
  updated_at: string;
  sync_status: string;
  last_synced_at: string | null;
  sync_error: string | null;
  deleted_at: string | null;
};

function mapLocalPinRow(row: LocalPinRow): LocalPin {
  return {
    id: row.id,
    tripId: row.trip_id,
    userId: row.user_id,
    name: row.name,
    startDate: row.start_date,
    startTime: row.start_time,
    endDate: row.end_date,
    endTime: row.end_time,
    allDay: Boolean(row.all_day),
    categoryId: row.category_id,
    metadataJson: parseMetadata(row.metadata_json),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    syncStatus: row.sync_status,
    lastSyncedAt: row.last_synced_at,
    syncError: row.sync_error,
    deletedAt: row.deleted_at,
  };
}

const selectLocalPinColumns = `
  id,
  trip_id,
  user_id,
  name,
  start_date,
  start_time,
  end_date,
  end_time,
  all_day,
  category_id,
  metadata_json,
  created_at,
  updated_at,
  sync_status,
  last_synced_at,
  sync_error,
  deleted_at
`;

export async function actionCreateLocalPin(input: CreateLocalPinInput) {
  const now = new Date().toISOString();
  const localPin = {
    id: buildUUID(),
    trip_id: input.tripId,
    user_id: input.userId,
    name: input.name.trim(),
    start_date: input.startDate,
    start_time: input.allDay ? null : input.startTime?.trim() || null,
    end_date: input.endDate,
    end_time: input.allDay ? null : input.endTime?.trim() || null,
    all_day: input.allDay ? 1 : 0,
    category_id: input.categoryId,
    metadata_json: stringifyMetadata(input.metadataJson),
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
        start_date,
        start_time,
        end_date,
        end_time,
        all_day,
        category_id,
        metadata_json,
        created_at,
        updated_at,
        sync_status,
        last_synced_at,
        sync_error,
        deleted_at
      ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      localPin.id,
      localPin.trip_id,
      localPin.user_id,
      localPin.name,
      localPin.start_date,
      localPin.start_time,
      localPin.end_date,
      localPin.end_time,
      localPin.all_day,
      localPin.category_id,
      localPin.metadata_json,
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
  const rows = await sqlite.getAllAsync<LocalPinRow>(
    `
      select ${selectLocalPinColumns}
      from pin
      where trip_id = ? and user_id = ? and deleted_at is null
      order by start_date asc, start_time asc, created_at asc
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
  const rows = await sqlite.getAllAsync<LocalPinRow>(
    `
      select ${selectLocalPinColumns}
      from pin
      where trip_id = ?
        and user_id = ?
        and start_date <= ?
        and end_date >= ?
        and deleted_at is null
      order by start_date asc, start_time asc, created_at asc
    `,
    [tripId, userId, date, date],
  );

  return rows.map(mapLocalPinRow);
}

export async function actionGetLocalPin(id: string, userId: string) {
  const row = await sqlite.getFirstAsync<LocalPinRow>(
    `
      select ${selectLocalPinColumns}
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
        start_date = ?,
        start_time = ?,
        end_date = ?,
        end_time = ?,
        all_day = ?,
        category_id = ?,
        metadata_json = ?,
        updated_at = ?,
        sync_status = ?,
        sync_error = ?
      where id = ? and user_id = ? and deleted_at is null
    `,
    [
      input.name.trim(),
      input.startDate,
      input.allDay ? null : input.startTime?.trim() || null,
      input.endDate,
      input.allDay ? null : input.endTime?.trim() || null,
      input.allDay ? 1 : 0,
      input.categoryId,
      stringifyMetadata(input.metadataJson),
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
  startDate: string;
  startTime: string | null;
  endDate: string;
  endTime: string | null;
  allDay: boolean;
  categoryId: string;
  metadataJson: PinMetadata;
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
        start_date,
        start_time,
        end_date,
        end_time,
        all_day,
        category_id,
        metadata_json,
        created_at,
        updated_at,
        sync_status,
        last_synced_at,
        sync_error,
        deleted_at
      ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      on conflict(id) do update set
        trip_id = excluded.trip_id,
        user_id = excluded.user_id,
        name = excluded.name,
        start_date = excluded.start_date,
        start_time = excluded.start_time,
        end_date = excluded.end_date,
        end_time = excluded.end_time,
        all_day = excluded.all_day,
        category_id = excluded.category_id,
        metadata_json = excluded.metadata_json,
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
      remotePin.startDate,
      remotePin.startTime,
      remotePin.endDate,
      remotePin.endTime,
      remotePin.allDay ? 1 : 0,
      remotePin.categoryId,
      stringifyMetadata(remotePin.metadataJson),
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
  const rows = await sqlite.getAllAsync<LocalPinRow>(
    `
      select ${selectLocalPinColumns}
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
      startDate: localPin.startDate,
      startTime: localPin.startTime,
      endDate: localPin.endDate,
      endTime: localPin.endTime,
      allDay: localPin.allDay,
      categoryId: localPin.categoryId,
      metadataJson: localPin.metadataJson,
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
