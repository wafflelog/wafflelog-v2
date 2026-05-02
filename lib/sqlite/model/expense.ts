import { sqlite } from "../client";

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

function createLocalId() {
  return `expense_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

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

export async function actionCreateLocalExpense(
  input: CreateLocalExpenseInput,
) {
  const now = new Date().toISOString();
  const localExpense = {
    id: createLocalId(),
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

export async function actionListLocalExpensesByPin(pinId: string, userId: string) {
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
