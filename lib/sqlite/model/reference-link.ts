import { sqlite } from "@/lib/sqlite/client";
import { buildUUID } from "@/lib/sqlite/utils";
import {
  actionDeleteRemoteReferenceLink,
  actionUpsertRemoteReferenceLinkFromLocal,
} from "@/lib/supabase/actions";

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
  deletedAt: string | null;
};

export type CreateLocalReferenceLinkInput = {
  pinId: string;
  userId: string;
  url: string;
  caption?: string;
};

const DEFAULT_SYNC_BATCH_SIZE = 25;

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
  deleted_at: string | null;
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
    deletedAt: row.deleted_at,
  };
}

export async function actionCreateLocalReferenceLink(
  input: CreateLocalReferenceLinkInput,
) {
  const now = new Date().toISOString();
  const normalizedUrl = input.url.trim();
  const normalizedCaption = input.caption?.trim() || null;

  const localReferenceLink = {
    id: buildUUID(),
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
    deleted_at: null,
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
        sync_error,
        deleted_at
      ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      localReferenceLink.deleted_at,
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
    deleted_at: string | null;
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
        sync_error,
        deleted_at
      from reference_link
      where pin_id = ? and user_id = ? and deleted_at is null
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
    deleted_at: string | null;
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
        rl.sync_error,
        rl.deleted_at
      from reference_link rl
      join pin p on p.id = rl.pin_id
      where p.trip_id = ? and rl.user_id = ? and rl.deleted_at is null
      order by rl.created_at desc
    `,
    [tripId, userId],
  );

  return rows.map(mapLocalReferenceLinkRow);
}

export async function actionListPendingLocalReferenceLinks(
  userId: string,
  limit = DEFAULT_SYNC_BATCH_SIZE,
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
    deleted_at: string | null;
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
        sync_error,
        deleted_at
      from reference_link
      where user_id = ? and sync_status != 'synced'
      order by created_at asc
      limit ?
    `,
    [userId, limit],
  );

  return rows.map(mapLocalReferenceLinkRow);
}

export async function actionSoftDeleteLocalReferenceLink(
  id: string,
  userId: string,
) {
  const now = new Date().toISOString();

  await sqlite.runAsync(
    `
      update reference_link
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

export async function actionHardDeleteLocalReferenceLink(
  id: string,
  userId: string,
) {
  await sqlite.runAsync(
    `
      delete from reference_link
      where id = ? and user_id = ?
    `,
    [id, userId],
  );
}

export async function actionMarkLocalReferenceLinkSyncing(
  id: string,
  userId: string,
) {
  await sqlite.runAsync(
    `
      update reference_link
      set
        sync_status = ?,
        sync_error = ?,
        updated_at = ?
      where id = ? and user_id = ?
    `,
    ["syncing", null, new Date().toISOString(), id, userId],
  );
}

export async function actionMarkLocalReferenceLinkSynced(
  id: string,
  userId: string,
) {
  const now = new Date().toISOString();

  await sqlite.runAsync(
    `
      update reference_link
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

export async function actionMarkLocalReferenceLinkSyncFailed(
  id: string,
  userId: string,
  errorMessage: string,
) {
  await sqlite.runAsync(
    `
      update reference_link
      set
        sync_status = ?,
        sync_error = ?,
        updated_at = ?
      where id = ? and user_id = ?
    `,
    ["failed", errorMessage, new Date().toISOString(), id, userId],
  );
}

export async function actionSyncLocalReferenceLink(
  localReferenceLink: LocalReferenceLink,
) {
  if (localReferenceLink.deletedAt) {
    if (!localReferenceLink.lastSyncedAt) {
      await actionHardDeleteLocalReferenceLink(
        localReferenceLink.id,
        localReferenceLink.userId,
      );
      return;
    }

    await actionMarkLocalReferenceLinkSyncing(
      localReferenceLink.id,
      localReferenceLink.userId,
    );

    try {
      await actionDeleteRemoteReferenceLink(localReferenceLink.id);
      await actionHardDeleteLocalReferenceLink(
        localReferenceLink.id,
        localReferenceLink.userId,
      );
      return;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete reference link";
      await actionMarkLocalReferenceLinkSyncFailed(
        localReferenceLink.id,
        localReferenceLink.userId,
        message,
      );
      throw error;
    }
  }

  await actionMarkLocalReferenceLinkSyncing(
    localReferenceLink.id,
    localReferenceLink.userId,
  );

  try {
    await actionUpsertRemoteReferenceLinkFromLocal({
      id: localReferenceLink.id,
      pinId: localReferenceLink.pinId,
      title: localReferenceLink.title,
      url: localReferenceLink.url,
      caption: localReferenceLink.caption,
    });

    await actionMarkLocalReferenceLinkSynced(
      localReferenceLink.id,
      localReferenceLink.userId,
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to sync reference link";
    await actionMarkLocalReferenceLinkSyncFailed(
      localReferenceLink.id,
      localReferenceLink.userId,
      message,
    );
    throw error;
  }
}

export async function actionSyncPendingLocalReferenceLinks(
  userId: string,
  limit = DEFAULT_SYNC_BATCH_SIZE,
) {
  const pendingReferenceLinks = await actionListPendingLocalReferenceLinks(
    userId,
    limit,
  );

  for (const referenceLink of pendingReferenceLinks) {
    await actionSyncLocalReferenceLink(referenceLink);
  }

  return {
    processed: pendingReferenceLinks.length,
    hasMore: pendingReferenceLinks.length === limit,
  };
}
