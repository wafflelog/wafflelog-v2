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
  return `pin_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
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
        updated_at
      ) values (?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        updated_at
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
        updated_at
      from pin
      where trip_id = ? and user_id = ? and date = ?
      order by time asc, created_at asc
    `,
    [tripId, userId, date],
  );

  return rows.map(mapLocalPinRow);
}
