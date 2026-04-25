import { sqlite } from "../client";

export type LocalReferenceLink = {
  id: string;
  pinId: string;
  userId: string;
  title: string | null;
  url: string;
  caption: string | null;
  createdAt: string;
  updatedAt: string;
  syncStatus: string;
  lastSyncedAt: string | null;
  syncError: string | null;
};

export type CreateLocalReferenceLinkInput = {
  pinId: string;
  userId: string;
  url: string;
  caption?: string;
};

function createLocalId() {
  return `reference_link_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function deriveTitleFromUrl(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function mapLocalReferenceLinkRow(row: {
  id: string;
  pin_id: string;
  user_id: string;
  title: string | null;
  url: string;
  caption: string | null;
  created_at: string;
  updated_at: string;
  sync_status: string;
  last_synced_at: string | null;
  sync_error: string | null;
}): LocalReferenceLink {
  return {
    id: row.id,
    pinId: row.pin_id,
    userId: row.user_id,
    title: row.title,
    url: row.url,
    caption: row.caption,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    syncStatus: row.sync_status,
    lastSyncedAt: row.last_synced_at,
    syncError: row.sync_error,
  };
}

export async function actionCreateLocalReferenceLink(
  input: CreateLocalReferenceLinkInput,
) {
  const now = new Date().toISOString();
  const normalizedUrl = input.url.trim();
  const normalizedCaption = input.caption?.trim() || null;

  const localReferenceLink = {
    id: createLocalId(),
    pin_id: input.pinId,
    user_id: input.userId,
    title: deriveTitleFromUrl(normalizedUrl),
    url: normalizedUrl,
    caption: normalizedCaption,
    created_at: now,
    updated_at: now,
    sync_status: "pending",
    last_synced_at: null,
    sync_error: null,
  };

  await sqlite.runAsync(
    `
      insert into reference_link (
        id,
        pin_id,
        user_id,
        title,
        url,
        caption,
        created_at,
        updated_at,
        sync_status,
        last_synced_at,
        sync_error
      ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      localReferenceLink.id,
      localReferenceLink.pin_id,
      localReferenceLink.user_id,
      localReferenceLink.title,
      localReferenceLink.url,
      localReferenceLink.caption,
      localReferenceLink.created_at,
      localReferenceLink.updated_at,
      localReferenceLink.sync_status,
      localReferenceLink.last_synced_at,
      localReferenceLink.sync_error,
    ],
  );

  return mapLocalReferenceLinkRow(localReferenceLink);
}

export async function actionListLocalReferenceLinksByPin(
  pinId: string,
  userId: string,
) {
  const rows = await sqlite.getAllAsync<{
    id: string;
    pin_id: string;
    user_id: string;
    title: string | null;
    url: string;
    caption: string | null;
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
        title,
        url,
        caption,
        created_at,
        updated_at,
        sync_status,
        last_synced_at,
        sync_error
      from reference_link
      where pin_id = ? and user_id = ?
      order by created_at desc
    `,
    [pinId, userId],
  );

  return rows.map(mapLocalReferenceLinkRow);
}

export async function actionListLocalReferenceLinksByTrip(
  tripId: string,
  userId: string,
) {
  const rows = await sqlite.getAllAsync<{
    id: string;
    pin_id: string;
    user_id: string;
    title: string | null;
    url: string;
    caption: string | null;
    created_at: string;
    updated_at: string;
    sync_status: string;
    last_synced_at: string | null;
    sync_error: string | null;
  }>(
    `
      select
        rl.id,
        rl.pin_id,
        rl.user_id,
        rl.title,
        rl.url,
        rl.caption,
        rl.created_at,
        rl.updated_at,
        rl.sync_status,
        rl.last_synced_at,
        rl.sync_error
      from reference_link rl
      join pin p on p.id = rl.pin_id
      where p.trip_id = ? and rl.user_id = ?
      order by rl.created_at desc
    `,
    [tripId, userId],
  );

  return rows.map(mapLocalReferenceLinkRow);
}
