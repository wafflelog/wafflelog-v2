import { removeLocalFile } from "@/lib/media/local-file";
import { sqlite } from "@/lib/sqlite/client";
import {
  actionListCompanionMemberships,
  type CompanionMembership,
} from "@/lib/supabase/actions";
import { actionUpsertLocalTripMembershipFromRemote } from "./trip";

type LocalCompanionTrip = {
  trip_id: string;
  membership_updated_at: string;
};

type LocalMediaFile = {
  local_uri: string | null;
};

async function removeTripMediaFiles(tripId: string) {
  const [documents, images] = await Promise.all([
    sqlite.getAllAsync<LocalMediaFile>(
      "select local_uri from document where trip_id = ?",
      [tripId],
    ),
    sqlite.getAllAsync<LocalMediaFile>(
      "select local_uri from image where trip_id = ?",
      [tripId],
    ),
  ]);

  const results = await Promise.allSettled(
    [...documents, ...images].map(({ local_uri }) =>
      removeLocalFile(local_uri),
    ),
  );

  for (const result of results) {
    if (result.status === "rejected") {
      console.warn("Unable to remove a cached trip file", result.reason);
    }
  }
}

export async function actionPurgeLocalCompanionTrip(
  tripId: string,
  userId: string,
) {
  const localTrip = await sqlite.getFirstAsync<{ user_id: string }>(
    "select user_id from trip where id = ?",
    [tripId],
  );

  if (!localTrip || localTrip.user_id === userId) {
    return false;
  }

  await removeTripMediaFiles(tripId);

  await sqlite.withExclusiveTransactionAsync(async (transaction) => {
    await transaction.runAsync(
      `
        delete from expense_participant
        where expense_id in (select id from expense where trip_id = ?)
      `,
      [tripId],
    );
    await transaction.runAsync(
      `
        delete from pin_location
        where pin_id in (select id from pin where trip_id = ?)
      `,
      [tripId],
    );

    for (const table of [
      "checklist_item",
      "note",
      "reference_link",
      "document",
      "image",
      "expense",
      "pin",
      "trip_membership",
    ]) {
      await transaction.runAsync(`delete from ${table} where trip_id = ?`, [
        tripId,
      ]);
    }

    await transaction.runAsync(
      "delete from trip where id = ? and user_id != ?",
      [tripId, userId],
    );
  });

  return true;
}

async function actionListLocalCompanionTrips(userId: string) {
  return sqlite.getAllAsync<LocalCompanionTrip>(
    `
      select distinct
        trip.id as trip_id,
        trip_membership.updated_at as membership_updated_at
      from trip
      inner join trip_membership
        on trip_membership.trip_id = trip.id
        and trip_membership.user_id = ?
      where trip.user_id != ?
    `,
    [userId, userId],
  );
}

export async function actionReconcileLocalCompanionAccess(
  userId: string,
  remoteMemberships?: CompanionMembership[],
) {
  const memberships =
    remoteMemberships ?? (await actionListCompanionMemberships());
  const activeMemberships = memberships.filter(
    (membership) => membership.status === "active",
  );
  const activeTripIds = new Set(
    activeMemberships.map((membership) => membership.tripId),
  );
  const activeMembershipByTripId = new Map(
    activeMemberships.map((membership) => [membership.tripId, membership]),
  );
  const localCompanionTrips = await actionListLocalCompanionTrips(userId);

  for (const {
    trip_id: tripId,
    membership_updated_at: localMembershipUpdatedAt,
  } of localCompanionTrips) {
    const remoteMembership = activeMembershipByTripId.get(tripId);
    const membershipWasRecreated =
      remoteMembership?.updatedAt !== localMembershipUpdatedAt;

    if (!activeTripIds.has(tripId) || membershipWasRecreated) {
      await actionPurgeLocalCompanionTrip(tripId, userId);
    }
  }

  for (const membership of activeMemberships) {
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

  return activeMemberships;
}
