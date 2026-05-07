import { sqlite } from "@/lib/sqlite/client";
import { buildUUID } from "@/lib/sqlite/utils";
import { actionUpsertRemoteExpenseFromLocal } from "@/lib/supabase/actions";

export type LocalExpense = {
  id: string;
  pinId: string;
  tripId: string;
  userId: string;
  description: string;
  amount: number;
  currency: string;
  paidByUserId: string;
  paidByName: string;
  createdAt: string;
  updatedAt: string;
  syncStatus: string;
  lastSyncedAt: string | null;
  syncError: string | null;
};

export type CreateLocalExpenseInput = {
  pinId: string;
  tripId: string;
  userId: string;
  description: string;
  amount: number;
  currency: string;
  paidByUserId: string;
  paidByName: string;
};

const DEFAULT_SYNC_BATCH_SIZE = 25;

function mapLocalExpenseRow(row: {
  id: string;
  pin_id: string;
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
}): LocalExpense {
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
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    syncStatus: row.sync_status,
    lastSyncedAt: row.last_synced_at,
    syncError: row.sync_error,
  };
}

export async function actionCreateLocalExpense(input: CreateLocalExpenseInput) {
  const now = new Date().toISOString();
  const localExpense = {
    id: buildUUID(),
    pin_id: input.pinId,
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
        sync_error
      ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    ],
  );

  return mapLocalExpenseRow(localExpense);
}

export async function actionListLocalExpensesByPin(
  pinId: string,
  userId: string,
) {
  const rows = await sqlite.getAllAsync<{
    id: string;
    pin_id: string;
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
        sync_error
      from expense
      where pin_id = ? and user_id = ?
      order by created_at desc
    `,
    [pinId, userId],
  );

  return rows.map(mapLocalExpenseRow);
}

export async function actionListLocalExpensesByTrip(
  tripId: string,
  userId: string,
) {
  const rows = await sqlite.getAllAsync<{
    id: string;
    pin_id: string;
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
        sync_error
      from expense
      where trip_id = ? and user_id = ?
      order by created_at desc
    `,
    [tripId, userId],
  );

  return rows.map(mapLocalExpenseRow);
}

export async function actionListPendingLocalExpenses(
  userId: string,
  limit = DEFAULT_SYNC_BATCH_SIZE,
) {
  const rows = await sqlite.getAllAsync<{
    id: string;
    pin_id: string;
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
        sync_error
      from expense
      where user_id = ? and sync_status != 'synced'
      order by created_at asc
      limit ?
    `,
    [userId, limit],
  );

  return rows.map(mapLocalExpenseRow);
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
