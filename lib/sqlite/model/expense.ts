import { sqlite } from "@/lib/sqlite/client";
import { buildUUID } from "@/lib/sqlite/utils";
import {
  actionSoftDeleteRemoteExpense,
  actionUpsertRemoteExpenseFromLocal,
} from "@/lib/supabase/actions";
import { type PinMetadata } from "@/types/pin";
import { type CreatorAttribution } from "./user-profile";

type LocalExpensePinSummary = {
  id: string;
  name: string | null;
  categoryId: string;
  metadataJson: PinMetadata;
  location: {
    displayName: string | null;
  } | null;
};

export type LocalExpense = {
  id: string;
  pinId: string | null;
  tripId: string;
  userId: string;
  description: string;
  amount: number;
  currency: string;
  paidByUserId: string;
  paidByName: string;
  paidByUsername: string | null;
  createdAt: string;
  updatedAt: string;
  syncStatus: string;
  lastSyncedAt: string | null;
  syncError: string | null;
  deletedAt: string | null;
  creator: CreatorAttribution;
  pin: LocalExpensePinSummary | null;
};

export type CreateLocalExpenseInput = {
  pinId?: string | null;
  tripId: string;
  userId: string;
  description: string;
  amount: number;
  currency: string;
  paidByUserId: string;
  paidByName: string;
};

const DEFAULT_SYNC_BATCH_SIZE = 25;

function parsePinMetadata(metadata: string | null): PinMetadata {
  if (!metadata) {
    return { version: 1 };
  }

  try {
    const parsed = JSON.parse(metadata) as Partial<PinMetadata>;
    return {
      version: 1,
      departure: parsed.departure,
      destination: parsed.destination,
    };
  } catch {
    return { version: 1 };
  }
}

function mapLocalExpenseRow(row: {
  id: string;
  pin_id: string | null;
  trip_id: string;
  user_id: string;
  description: string;
  amount: number;
  currency: string;
  paid_by_user_id: string;
  paid_by_name: string;
  payer_username?: string | null;
  created_at: string;
  updated_at: string;
  sync_status: string;
  last_synced_at: string | null;
  sync_error: string | null;
  deleted_at: string | null;
  pin_name?: string | null;
  pin_category_id?: string | null;
  pin_metadata_json?: string | null;
  pin_display_name?: string | null;
  creator_username?: string | null;
}, currentUserId?: string): LocalExpense {
  return {
    id: row.id,
    pinId: row.pin_id,
    tripId: row.trip_id,
    userId: row.user_id,
    description: row.description,
    amount: row.amount,
    currency: row.currency,
    paidByUserId: row.paid_by_user_id,
    paidByName: row.paid_by_name,
    paidByUsername: row.payer_username ?? null,
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
    pin:
      row.pin_id && row.pin_category_id
        ? {
            id: row.pin_id,
            name: row.pin_name ?? null,
            categoryId: row.pin_category_id,
            metadataJson: parsePinMetadata(row.pin_metadata_json ?? null),
            location: {
              displayName: row.pin_display_name ?? null,
            },
          }
        : null,
  };
}

export async function actionCreateLocalExpense(input: CreateLocalExpenseInput) {
  const now = new Date().toISOString();
  const localExpense = {
    id: buildUUID(),
    pin_id: input.pinId ?? null,
    trip_id: input.tripId,
    user_id: input.userId,
    description: input.description.trim(),
    amount: input.amount,
    currency: input.currency.trim(),
    paid_by_user_id: input.paidByUserId,
    paid_by_name: input.paidByName.trim(),
    created_at: now,
    updated_at: now,
    sync_status: "pending",
    last_synced_at: null,
    sync_error: null,
    deleted_at: null,
  };

  await sqlite.runAsync(
    `
      insert into expense (
        id,
        pin_id,
        trip_id,
        user_id,
        description,
        amount,
        currency,
        paid_by_user_id,
        paid_by_name,
        created_at,
        updated_at,
        sync_status,
        last_synced_at,
        sync_error,
        deleted_at
      ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      localExpense.id,
      localExpense.pin_id,
      localExpense.trip_id,
      localExpense.user_id,
      localExpense.description,
      localExpense.amount,
      localExpense.currency,
      localExpense.paid_by_user_id,
      localExpense.paid_by_name,
      localExpense.created_at,
      localExpense.updated_at,
      localExpense.sync_status,
      localExpense.last_synced_at,
      localExpense.sync_error,
      localExpense.deleted_at,
    ],
  );

  return mapLocalExpenseRow(localExpense, input.userId);
}

export async function actionListLocalExpensesByPin(
  pinId: string,
  userId: string,
) {
  const rows = await sqlite.getAllAsync<{
    id: string;
    pin_id: string | null;
    trip_id: string;
    user_id: string;
    description: string;
    amount: number;
    currency: string;
    paid_by_user_id: string;
    paid_by_name: string;
    payer_username: string | null;
    created_at: string;
    updated_at: string;
    sync_status: string;
    last_synced_at: string | null;
    sync_error: string | null;
    deleted_at: string | null;
  }>(
    `
      select
        expense.id,
        expense.pin_id,
        expense.trip_id,
        expense.user_id,
        expense.description,
        expense.amount,
        expense.currency,
        expense.paid_by_user_id,
        expense.paid_by_name,
        payer_profile.username as payer_username,
        expense.created_at,
        expense.updated_at,
        expense.sync_status,
        expense.last_synced_at,
        expense.sync_error,
        expense.deleted_at,
        user_profile.username as creator_username
      from expense
      left join user_profile
        on user_profile.id = expense.user_id
      left join user_profile as payer_profile
        on payer_profile.id = expense.paid_by_user_id
      where expense.pin_id = ? and expense.deleted_at is null
      order by expense.created_at desc
    `,
    [pinId],
  );

  return rows.map((row) => mapLocalExpenseRow(row, userId));
}

export async function actionListLocalExpensesByTrip(
  tripId: string,
  userId: string,
) {
  const rows = await sqlite.getAllAsync<{
    id: string;
    pin_id: string | null;
    trip_id: string;
    user_id: string;
    description: string;
    amount: number;
    currency: string;
    paid_by_user_id: string;
    paid_by_name: string;
    payer_username: string | null;
    created_at: string;
    updated_at: string;
    sync_status: string;
    last_synced_at: string | null;
    sync_error: string | null;
    deleted_at: string | null;
    pin_name: string | null;
    pin_category_id: string | null;
    pin_metadata_json: string | null;
    pin_display_name: string | null;
    creator_username: string | null;
  }>(
    `
      select
        expense.id,
        expense.pin_id,
        expense.trip_id,
        expense.user_id,
        expense.description,
        expense.amount,
        expense.currency,
        expense.paid_by_user_id,
        expense.paid_by_name,
        payer_profile.username as payer_username,
        expense.created_at,
        expense.updated_at,
        expense.sync_status,
        expense.last_synced_at,
        expense.sync_error,
        expense.deleted_at,
        pin.name as pin_name,
        pin.category_id as pin_category_id,
        pin.metadata_json as pin_metadata_json,
        pin_location.display_name as pin_display_name,
        user_profile.username as creator_username
      from expense
      left join user_profile
        on user_profile.id = expense.user_id
      left join user_profile as payer_profile
        on payer_profile.id = expense.paid_by_user_id
      left join pin
        on pin.id = expense.pin_id
      left join pin_location
        on pin_location.pin_id = pin.id
      where expense.trip_id = ? and expense.deleted_at is null
      order by expense.created_at desc
    `,
    [tripId],
  );

  return rows.map((row) => mapLocalExpenseRow(row, userId));
}

export async function actionListPendingLocalExpenses(
  userId: string,
  limit = DEFAULT_SYNC_BATCH_SIZE,
) {
  const rows = await sqlite.getAllAsync<{
    id: string;
    pin_id: string | null;
    trip_id: string;
    user_id: string;
    description: string;
    amount: number;
    currency: string;
    paid_by_user_id: string;
    paid_by_name: string;
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
        pin_id,
        trip_id,
        user_id,
        description,
        amount,
        currency,
        paid_by_user_id,
        paid_by_name,
        created_at,
        updated_at,
        sync_status,
        last_synced_at,
        sync_error,
        deleted_at
      from expense
      where user_id = ? and sync_status != 'synced'
      order by created_at asc
      limit ?
    `,
    [userId, limit],
  );

  return rows.map((row) => mapLocalExpenseRow(row, userId));
}

export async function actionSoftDeleteLocalExpense(id: string, userId: string) {
  const now = new Date().toISOString();

  await sqlite.runAsync(
    `
      update expense
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

export async function actionHardDeleteLocalExpense(id: string, userId: string) {
  await sqlite.runAsync(
    `
      delete from expense
      where id = ? and user_id = ?
    `,
    [id, userId],
  );
}

export async function actionMarkLocalExpenseSyncing(id: string, userId: string) {
  await sqlite.runAsync(
    `
      update expense
      set
        sync_status = ?,
        sync_error = ?,
        updated_at = ?
      where id = ? and user_id = ?
    `,
    ["syncing", null, new Date().toISOString(), id, userId],
  );
}

export async function actionMarkLocalExpenseSynced(id: string, userId: string) {
  const now = new Date().toISOString();

  await sqlite.runAsync(
    `
      update expense
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

export async function actionMarkLocalExpenseSyncFailed(
  id: string,
  userId: string,
  errorMessage: string,
) {
  await sqlite.runAsync(
    `
      update expense
      set
        sync_status = ?,
        sync_error = ?,
        updated_at = ?
      where id = ? and user_id = ?
    `,
    ["failed", errorMessage, new Date().toISOString(), id, userId],
  );
}

export async function actionSyncLocalExpense(localExpense: LocalExpense) {
  if (localExpense.deletedAt) {
    if (!localExpense.lastSyncedAt) {
      await actionHardDeleteLocalExpense(localExpense.id, localExpense.userId);
      return;
    }

    await actionMarkLocalExpenseSyncing(localExpense.id, localExpense.userId);

    try {
      await actionSoftDeleteRemoteExpense(localExpense.id);
      await actionHardDeleteLocalExpense(localExpense.id, localExpense.userId);
      return;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete expense";
      await actionMarkLocalExpenseSyncFailed(
        localExpense.id,
        localExpense.userId,
        message,
      );
      throw error;
    }
  }

  await actionMarkLocalExpenseSyncing(localExpense.id, localExpense.userId);

  try {
    await actionUpsertRemoteExpenseFromLocal({
      id: localExpense.id,
      pinId: localExpense.pinId,
      tripId: localExpense.tripId,
      description: localExpense.description,
      amount: localExpense.amount,
      currency: localExpense.currency,
      paidByUserId: localExpense.paidByUserId,
      paidByName: localExpense.paidByName,
    });

    await actionMarkLocalExpenseSynced(localExpense.id, localExpense.userId);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to sync expense";
    await actionMarkLocalExpenseSyncFailed(
      localExpense.id,
      localExpense.userId,
      message,
    );
    throw error;
  }
}

export async function actionSyncPendingLocalExpenses(
  userId: string,
  limit = DEFAULT_SYNC_BATCH_SIZE,
) {
  const pendingExpenses = await actionListPendingLocalExpenses(userId, limit);

  for (const expense of pendingExpenses) {
    await actionSyncLocalExpense(expense);
  }

  return {
    processed: pendingExpenses.length,
    hasMore: pendingExpenses.length === limit,
  };
}
