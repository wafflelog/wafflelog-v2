import { isRangePinCategory } from "@/lib/pin";
import { sqlite } from "@/lib/sqlite/client";
import { buildUUID } from "@/lib/sqlite/utils";
import {
  actionSoftDeleteRemotePin,
  actionUpsertRemotePinFromLocal,
} from "@/lib/supabase/actions";
import { type PinMetadata } from "@/types/pin";

export type LocalPinLocationSummary = {
  placeId: string;
  displayName: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
};

export type LocalPin = {
  id: string;
  tripId: string;
  userId: string;
  name: string | null;
  startDate: string;
  endDate: string | null;
  time: string | null;
  categoryId: string;
  metadataJson: PinMetadata;
  createdAt: string;
  updatedAt: string;
  syncStatus: string;
  lastSyncedAt: string | null;
  syncError: string | null;
  deletedAt: string | null;
  location: LocalPinLocationSummary | null;
};

export type CreateLocalPinInput = {
  tripId: string;
  userId: string;
  name: string | null;
  startDate: string;
  endDate: string | null;
  time: string | null;
  categoryId: string;
  metadataJson: PinMetadata;
};

export type UpdateLocalPinInput = {
  id: string;
  userId: string;
  name: string | null;
  startDate: string;
  endDate: string | null;
  time: string | null;
  categoryId: string;
  metadataJson: PinMetadata;
};

const DEFAULT_SYNC_BATCH_SIZE = 25;
const DEFAULT_PIN_METADATA: PinMetadata = { version: 1 };

const normalizeName = (name: string | null) => name?.trim() || null;
const normalizeTime = (time: string | null) => time?.trim() || null;
const normalizeEndDate = (categoryId: string, endDate: string | null) =>
  isRangePinCategory(categoryId) ? endDate : null;

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
    };
  } catch {
    return DEFAULT_PIN_METADATA;
  }
};

type LocalPinRow = {
  id: string;
  trip_id: string;
  user_id: string;
  name: string | null;
  start_date: string;
  end_date: string | null;
  time: string | null;
  category_id: string;
  metadata_json: string | null;
  created_at: string;
  updated_at: string;
  sync_status: string;
  last_synced_at: string | null;
  sync_error: string | null;
  deleted_at: string | null;
  place_id?: string | null;
  display_name?: string | null;
  formatted_address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

function mapLocalPinRow(row: LocalPinRow): LocalPin {
  return {
    id: row.id,
    tripId: row.trip_id,
    userId: row.user_id,
    name: row.name,
    startDate: row.start_date,
    endDate: row.end_date,
    time: row.time,
    categoryId: row.category_id,
    metadataJson: parseMetadata(row.metadata_json),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    syncStatus: row.sync_status,
    lastSyncedAt: row.last_synced_at,
    syncError: row.sync_error,
    deletedAt: row.deleted_at,
    location:
      row.place_id &&
      row.display_name &&
      row.latitude !== undefined &&
      row.latitude !== null &&
      row.longitude !== undefined &&
      row.longitude !== null
        ? {
            placeId: row.place_id,
            displayName: row.display_name,
            formattedAddress: row.formatted_address ?? "",
            latitude: row.latitude,
            longitude: row.longitude,
          }
        : null,
  };
}

const selectLocalPinColumns = `
  pin.id,
  pin.trip_id,
  pin.user_id,
  pin.name,
  pin.start_date,
  pin.end_date,
  pin.time,
  pin.category_id,
  pin.metadata_json,
  pin.created_at,
  pin.updated_at,
  pin.sync_status,
  pin.last_synced_at,
  pin.sync_error,
  pin.deleted_at,
  pin_location.place_id,
  pin_location.display_name,
  pin_location.formatted_address,
  pin_location.latitude,
  pin_location.longitude
`;

export async function actionCreateLocalPin(input: CreateLocalPinInput) {
  const now = new Date().toISOString();
  const localPin = {
    id: buildUUID(),
    trip_id: input.tripId,
    user_id: input.userId,
    name: normalizeName(input.name),
    start_date: input.startDate,
    end_date: normalizeEndDate(input.categoryId, input.endDate),
    time: normalizeTime(input.time),
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
        end_date,
        time,
        category_id,
        metadata_json,
        created_at,
        updated_at,
        sync_status,
        last_synced_at,
        sync_error,
        deleted_at
      ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      localPin.id,
      localPin.trip_id,
      localPin.user_id,
      localPin.name,
      localPin.start_date,
      localPin.end_date,
      localPin.time,
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
      left join pin_location
        on pin_location.pin_id = pin.id
        and pin_location.user_id = pin.user_id
      where pin.trip_id = ? and pin.user_id = ? and pin.deleted_at is null
      order by pin.start_date asc, pin.time asc, pin.created_at asc
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
      left join pin_location
        on pin_location.pin_id = pin.id
        and pin_location.user_id = pin.user_id
      where pin.trip_id = ?
        and pin.user_id = ?
        and pin.start_date <= ?
        and coalesce(pin.end_date, pin.start_date) >= ?
        and pin.deleted_at is null
      order by pin.start_date asc, pin.time asc, pin.created_at asc
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
      left join pin_location
        on pin_location.pin_id = pin.id
        and pin_location.user_id = pin.user_id
      where pin.id = ? and pin.user_id = ? and pin.deleted_at is null
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
        end_date = ?,
        time = ?,
        category_id = ?,
        metadata_json = ?,
        updated_at = ?,
        sync_status = ?,
        sync_error = ?
      where id = ? and user_id = ? and deleted_at is null
    `,
    [
      normalizeName(input.name),
      input.startDate,
      normalizeEndDate(input.categoryId, input.endDate),
      normalizeTime(input.time),
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
  name: string | null;
  startDate: string;
  endDate: string | null;
  time: string | null;
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
        end_date,
        time,
        category_id,
        metadata_json,
        created_at,
        updated_at,
        sync_status,
        last_synced_at,
        sync_error,
        deleted_at
      ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      on conflict(id) do update set
        trip_id = excluded.trip_id,
        user_id = excluded.user_id,
        name = excluded.name,
        start_date = excluded.start_date,
        end_date = excluded.end_date,
        time = excluded.time,
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
      normalizeName(remotePin.name),
      remotePin.startDate,
      normalizeEndDate(remotePin.categoryId, remotePin.endDate),
      normalizeTime(remotePin.time),
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
      left join pin_location
        on pin_location.pin_id = pin.id
        and pin_location.user_id = pin.user_id
      where pin.user_id = ? and pin.sync_status != 'synced'
      order by pin.created_at asc
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
      endDate: localPin.endDate,
      time: localPin.time,
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
