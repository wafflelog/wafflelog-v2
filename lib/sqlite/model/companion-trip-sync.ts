import { sqlite } from "@/lib/sqlite/client";
import {
  actionGetRemoteTripSyncBundle,
  actionListActiveCompanionMemberships,
  type RemoteTripSyncBundle,
} from "@/lib/supabase/actions";
import { actionUpsertLocalPinFromRemote } from "./pin";
import {
  actionUpsertLocalTripFromRemote,
  actionUpsertLocalTripMembershipFromRemote,
} from "./trip";
import { actionUpsertLocalUserProfilesFromRemote } from "./user-profile";

const DEFAULT_SYNC_BATCH_SIZE = 25;

async function upsertChecklistItemFromRemote(
  checklistItem: RemoteTripSyncBundle["checklistItems"][number],
) {
  const now = new Date().toISOString();

  await sqlite.runAsync(
    `
      insert into checklist_item (
        id,
        trip_id,
        user_id,
        title,
        completed,
        created_at,
        updated_at,
        sync_status,
        last_synced_at,
        sync_error,
        deleted_at
      ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      on conflict(id) do update set
        trip_id = excluded.trip_id,
        user_id = excluded.user_id,
        title = excluded.title,
        completed = excluded.completed,
        created_at = excluded.created_at,
        updated_at = excluded.updated_at,
        sync_status = excluded.sync_status,
        last_synced_at = excluded.last_synced_at,
        sync_error = excluded.sync_error,
        deleted_at = excluded.deleted_at
    `,
    [
      checklistItem.id,
      checklistItem.tripId,
      checklistItem.userId,
      checklistItem.title,
      checklistItem.completed ? 1 : 0,
      checklistItem.createdAt,
      checklistItem.updatedAt,
      "synced",
      now,
      null,
      checklistItem.deletedAt,
    ],
  );
}

async function upsertNoteFromRemote(note: RemoteTripSyncBundle["notes"][number]) {
  const now = new Date().toISOString();

  await sqlite.runAsync(
    `
      insert into note (
        id,
        trip_id,
        pin_id,
        user_id,
        text,
        created_at,
        updated_at,
        sync_status,
        last_synced_at,
        sync_error,
        deleted_at
      ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      on conflict(id) do update set
        trip_id = excluded.trip_id,
        pin_id = excluded.pin_id,
        user_id = excluded.user_id,
        text = excluded.text,
        created_at = excluded.created_at,
        updated_at = excluded.updated_at,
        sync_status = excluded.sync_status,
        last_synced_at = excluded.last_synced_at,
        sync_error = excluded.sync_error,
        deleted_at = excluded.deleted_at
    `,
    [
      note.id,
      note.tripId,
      note.pinId,
      note.userId,
      note.text,
      note.createdAt,
      note.updatedAt,
      "synced",
      now,
      null,
      note.deletedAt,
    ],
  );
}

async function upsertReferenceLinkFromRemote(
  referenceLink: RemoteTripSyncBundle["referenceLinks"][number],
) {
  const now = new Date().toISOString();

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
      on conflict(id) do update set
        trip_id = excluded.trip_id,
        pin_id = excluded.pin_id,
        user_id = excluded.user_id,
        title = excluded.title,
        url = excluded.url,
        caption = excluded.caption,
        created_at = excluded.created_at,
        updated_at = excluded.updated_at,
        sync_status = excluded.sync_status,
        last_synced_at = excluded.last_synced_at,
        sync_error = excluded.sync_error,
        deleted_at = excluded.deleted_at
    `,
    [
      referenceLink.id,
      referenceLink.tripId,
      referenceLink.pinId,
      referenceLink.userId,
      referenceLink.title,
      referenceLink.url,
      referenceLink.caption,
      referenceLink.createdAt,
      referenceLink.updatedAt,
      "synced",
      now,
      null,
      referenceLink.deletedAt,
    ],
  );
}

async function upsertExpenseFromRemote(
  expense: RemoteTripSyncBundle["expenses"][number],
  participants: RemoteTripSyncBundle["expenseParticipants"],
) {
  const now = new Date().toISOString();

  await sqlite.withTransactionAsync(async () => {
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
      on conflict(id) do update set
        pin_id = excluded.pin_id,
        trip_id = excluded.trip_id,
        user_id = excluded.user_id,
        description = excluded.description,
        amount = excluded.amount,
        currency = excluded.currency,
        paid_by_user_id = excluded.paid_by_user_id,
        paid_by_name = excluded.paid_by_name,
        created_at = excluded.created_at,
        updated_at = excluded.updated_at,
        sync_status = excluded.sync_status,
        last_synced_at = excluded.last_synced_at,
        sync_error = excluded.sync_error,
        deleted_at = excluded.deleted_at
    `,
    [
      expense.id,
      expense.pinId,
      expense.tripId,
      expense.userId,
      expense.description,
      expense.amount,
      expense.currency,
      expense.paidByUserId,
      expense.paidByName,
      expense.createdAt,
      expense.updatedAt,
      "synced",
      now,
      null,
      expense.deletedAt,
    ],
    );

    await sqlite.runAsync(
      "delete from expense_participant where expense_id = ?",
      [expense.id],
    );

    for (const participant of participants) {
      await sqlite.runAsync(
        `
          insert into expense_participant (
            expense_id,
            user_id,
            split_amount,
            created_at,
            updated_at
          ) values (?, ?, ?, ?, ?)
        `,
        [
          expense.id,
          participant.userId,
          participant.splitAmount,
          expense.createdAt,
          expense.updatedAt,
        ],
      );
    }
  });
}

async function upsertDocumentFromRemote(
  document: RemoteTripSyncBundle["documents"][number],
) {
  const now = new Date().toISOString();

  await sqlite.runAsync(
    `
      insert into document (
        id,
        trip_id,
        pin_id,
        user_id,
        file_name,
        mime_type,
        local_uri,
        storage_bucket,
        storage_path,
        caption,
        created_at,
        updated_at,
        sync_status,
        last_synced_at,
        sync_error,
        deleted_at
      ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      on conflict(id) do update set
        trip_id = excluded.trip_id,
        pin_id = excluded.pin_id,
        user_id = excluded.user_id,
        file_name = excluded.file_name,
        mime_type = excluded.mime_type,
        storage_bucket = excluded.storage_bucket,
        storage_path = excluded.storage_path,
        caption = excluded.caption,
        created_at = excluded.created_at,
        updated_at = excluded.updated_at,
        sync_status = excluded.sync_status,
        last_synced_at = excluded.last_synced_at,
        sync_error = excluded.sync_error,
        deleted_at = excluded.deleted_at
    `,
    [
      document.id,
      document.tripId,
      document.pinId,
      document.userId,
      document.fileName,
      document.mimeType,
      null,
      document.storageBucket,
      document.storagePath,
      document.caption,
      document.createdAt,
      document.updatedAt,
      "synced",
      now,
      null,
      document.deletedAt,
    ],
  );
}

async function upsertImageFromRemote(image: RemoteTripSyncBundle["images"][number]) {
  const now = new Date().toISOString();

  await sqlite.runAsync(
    `
      insert into image (
        id,
        pin_id,
        trip_id,
        user_id,
        local_uri,
        storage_bucket,
        storage_path,
        mime_type,
        width,
        height,
        caption,
        created_at,
        updated_at,
        sync_status,
        last_synced_at,
        sync_error,
        deleted_at
      ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      on conflict(id) do update set
        pin_id = excluded.pin_id,
        trip_id = excluded.trip_id,
        user_id = excluded.user_id,
        storage_bucket = excluded.storage_bucket,
        storage_path = excluded.storage_path,
        mime_type = excluded.mime_type,
        width = excluded.width,
        height = excluded.height,
        caption = excluded.caption,
        created_at = excluded.created_at,
        updated_at = excluded.updated_at,
        sync_status = excluded.sync_status,
        last_synced_at = excluded.last_synced_at,
        sync_error = excluded.sync_error,
        deleted_at = excluded.deleted_at
    `,
    [
      image.id,
      image.pinId,
      image.tripId,
      image.userId,
      image.storagePath,
      image.storageBucket,
      image.storagePath,
      image.mimeType,
      image.width,
      image.height,
      image.caption,
      image.createdAt,
      image.updatedAt,
      "synced",
      now,
      null,
      image.deletedAt,
    ],
  );
}

async function actionPullCompanionTrip(membership: {
  tripId: string;
  userId: string;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}) {
  await actionPullTripBundle(membership.tripId);
  await actionUpsertLocalTripMembershipFromRemote({
    tripId: membership.tripId,
    userId: membership.userId,
    role: membership.role,
    status: membership.status,
    source: "companion",
    createdAt: membership.createdAt,
    updatedAt: membership.updatedAt,
  });
}

async function actionPullTripBundle(tripId: string) {
  const bundle = await actionGetRemoteTripSyncBundle(tripId);

  await actionUpsertLocalUserProfilesFromRemote(bundle.userProfiles);
  await actionUpsertLocalTripFromRemote(bundle.trip);

  for (const pin of bundle.pins) {
    await actionUpsertLocalPinFromRemote(pin);
  }

  for (const checklistItem of bundle.checklistItems) {
    await upsertChecklistItemFromRemote(checklistItem);
  }

  for (const note of bundle.notes) {
    await upsertNoteFromRemote(note);
  }

  for (const referenceLink of bundle.referenceLinks) {
    await upsertReferenceLinkFromRemote(referenceLink);
  }

  for (const expense of bundle.expenses) {
    await upsertExpenseFromRemote(
      expense,
      bundle.expenseParticipants.filter(
        (participant) => participant.expenseId === expense.id,
      ),
    );
  }

  for (const document of bundle.documents) {
    await upsertDocumentFromRemote(document);
  }

  for (const image of bundle.images) {
    await upsertImageFromRemote(image);
  }
}

export async function actionPullOwnedTrips(
  userId: string,
  limit = DEFAULT_SYNC_BATCH_SIZE,
  offset = 0,
) {
  const trips = await sqlite.getAllAsync<{ id: string }>(
    `
      select id
      from trip
      where user_id = ? and deleted_at is null
      order by updated_at desc
      limit ? offset ?
    `,
    [userId, limit, offset],
  );

  for (const trip of trips) {
    await actionPullTripBundle(trip.id);
  }

  return {
    processed: trips.length,
    nextOffset: offset + trips.length,
    hasMore: trips.length === limit,
  };
}

export async function actionPullActiveCompanionTrips(
  limit = DEFAULT_SYNC_BATCH_SIZE,
  offset = 0,
) {
  const memberships = await actionListActiveCompanionMemberships();
  const limitedMemberships = memberships.slice(offset, offset + limit);

  for (const membership of limitedMemberships) {
    await actionPullCompanionTrip(membership);
  }

  const nextOffset = offset + limitedMemberships.length;

  return {
    processed: limitedMemberships.length,
    nextOffset,
    hasMore: memberships.length > nextOffset,
  };
}
