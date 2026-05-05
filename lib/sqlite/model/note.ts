import { sqlite } from "../client";

export type LocalNote = {
  id: string;
  pinId: string;
  userId: string;
  text: string;
  createdAt: string;
  updatedAt: string;
  syncStatus: string;
  lastSyncedAt: string | null;
  syncError: string | null;
};

export type CreateLocalNoteInput = {
  pinId: string;
  userId: string;
  text: string;
};

function createLocalId() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

function mapLocalNoteRow(row: {
  id: string;
  pin_id: string;
  user_id: string;
  text: string;
  created_at: string;
  updated_at: string;
  sync_status: string;
  last_synced_at: string | null;
  sync_error: string | null;
}): LocalNote {
  return {
    id: row.id,
    pinId: row.pin_id,
    userId: row.user_id,
    text: row.text,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    syncStatus: row.sync_status,
    lastSyncedAt: row.last_synced_at,
    syncError: row.sync_error,
  };
}

export async function actionCreateLocalNote(input: CreateLocalNoteInput) {
  const now = new Date().toISOString();
  const normalizedText = input.text.trim();

  if (!normalizedText) {
    throw new Error("Note cannot be empty");
  }

  const localNote = {
    id: createLocalId(),
    pin_id: input.pinId,
    user_id: input.userId,
    text: normalizedText,
    created_at: now,
    updated_at: now,
    sync_status: "pending",
    last_synced_at: null,
    sync_error: null,
  };

  await sqlite.runAsync(
    `
      insert into note (
        id,
        pin_id,
        user_id,
        text,
        created_at,
        updated_at,
        sync_status,
        last_synced_at,
        sync_error
      ) values (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      localNote.id,
      localNote.pin_id,
      localNote.user_id,
      localNote.text,
      localNote.created_at,
      localNote.updated_at,
      localNote.sync_status,
      localNote.last_synced_at,
      localNote.sync_error,
    ],
  );

  return mapLocalNoteRow(localNote);
}

export async function actionListLocalNotesByPin(pinId: string, userId: string) {
  const rows = await sqlite.getAllAsync<{
    id: string;
    pin_id: string;
    user_id: string;
    text: string;
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
        user_id,
        text,
        created_at,
        updated_at,
        sync_status,
        last_synced_at,
        sync_error
      from note
      where pin_id = ? and user_id = ?
      order by created_at desc
    `,
    [pinId, userId],
  );

  return rows.map(mapLocalNoteRow);
}
