import { sqlite } from "@/lib/sqlite/client";
import { buildUUID } from "@/lib/sqlite/utils";
import {
  actionSoftDeleteRemoteReferenceLink,
  actionUpsertRemoteReferenceLinkFromLocal,
} from "@/lib/supabase/actions";
import { type PinMetadata } from "@/types/pin";
import { type CreatorAttribution } from "./user-profile";

type LocalReferenceLinkPinSummary = {
  id: string;
  name: string | null;
  categoryId: string;
  metadataJson: PinMetadata;
  location: {
    displayName: string | null;
  } | null;
};

export type LocalReferenceLink = {
  id: string;
  tripId: string;
  pinId: string | null;
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
  creator: CreatorAttribution;
  pin: LocalReferenceLinkPinSummary | null;
};

export type CreateLocalReferenceLinkInput = {
  tripId: string;
  pinId?: string | null;
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

function mapLocalReferenceLinkRow(row: {
  id: string;
  trip_id: string;
  pin_id: string | null;
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
  pin_name?: string | null;
  pin_category_id?: string | null;
  pin_metadata_json?: string | null;
  pin_display_name?: string | null;
  creator_username?: string | null;
}, currentUserId?: string): LocalReferenceLink {
  return {
    id: row.id,
    tripId: row.trip_id,
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

export async function actionCreateLocalReferenceLink(
  input: CreateLocalReferenceLinkInput,
) {
  const now = new Date().toISOString();
  const normalizedUrl = input.url.trim();
  const normalizedCaption = input.caption?.trim() || null;

  const localReferenceLink = {
    id: buildUUID(),
    trip_id: input.tripId,
    pin_id: input.pinId ?? null,
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
        trip_id,
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
      ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      localReferenceLink.id,
      localReferenceLink.trip_id,
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

  return mapLocalReferenceLinkRow(localReferenceLink, input.userId);
}

export async function actionListLocalReferenceLinksByPin(
  pinId: string,
  userId: string,
) {
  const rows = await sqlite.getAllAsync<{
    id: string;
    trip_id: string;
    pin_id: string | null;
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
        reference_link.id,
        reference_link.trip_id,
        reference_link.pin_id,
        reference_link.user_id,
        reference_link.title,
        reference_link.url,
        reference_link.caption,
        reference_link.created_at,
        reference_link.updated_at,
        reference_link.sync_status,
        reference_link.last_synced_at,
        reference_link.sync_error,
        reference_link.deleted_at,
        user_profile.username as creator_username
      from reference_link
      left join user_profile
        on user_profile.id = reference_link.user_id
      where reference_link.pin_id = ? and reference_link.deleted_at is null
      order by reference_link.created_at desc
    `,
    [pinId],
  );

  return rows.map((row) => mapLocalReferenceLinkRow(row, userId));
}

export async function actionListLocalReferenceLinksByTrip(
  tripId: string,
  userId: string,
) {
  const rows = await sqlite.getAllAsync<{
    id: string;
    trip_id: string;
    pin_id: string | null;
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
    pin_name: string | null;
    pin_category_id: string | null;
    pin_metadata_json: string | null;
    pin_display_name: string | null;
    creator_username: string | null;
  }>(
    `
      select
        rl.id,
        rl.trip_id,
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
        rl.deleted_at,
        pin.name as pin_name,
        pin.category_id as pin_category_id,
        pin.metadata_json as pin_metadata_json,
        pin_location.display_name as pin_display_name,
        user_profile.username as creator_username
      from reference_link rl
      left join user_profile
        on user_profile.id = rl.user_id
      left join pin
        on pin.id = rl.pin_id
      left join pin_location
        on pin_location.pin_id = pin.id
      where rl.trip_id = ? and rl.deleted_at is null
      order by rl.created_at desc
    `,
    [tripId],
  );

  return rows.map((row) => mapLocalReferenceLinkRow(row, userId));
}

export async function actionListPendingLocalReferenceLinks(
  userId: string,
  limit = DEFAULT_SYNC_BATCH_SIZE,
) {
  const rows = await sqlite.getAllAsync<{
    id: string;
    trip_id: string;
    pin_id: string | null;
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
        trip_id,
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

  return rows.map((row) => mapLocalReferenceLinkRow(row, userId));
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
      await actionSoftDeleteRemoteReferenceLink(localReferenceLink.id);
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
      tripId: localReferenceLink.tripId,
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
