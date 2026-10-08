import {
  actionPullActiveCompanionTrips,
  actionPullOwnedTrips,
} from "@/lib/sqlite/model/companion-trip-sync";

const SYNC_BATCH_SIZE = 25;

async function downloadKnownOwnedTrips(userId: string) {
  let offset = 0;

  while (true) {
    const result = await actionPullOwnedTrips(
      userId,
      SYNC_BATCH_SIZE,
      offset,
    );

    if (result.processed === 0 || !result.hasMore) {
      return;
    }

    offset = result.nextOffset;
  }
}

async function downloadActiveCompanionTrips() {
  let offset = 0;

  while (true) {
    const result = await actionPullActiveCompanionTrips(
      SYNC_BATCH_SIZE,
      offset,
    );

    if (result.processed === 0 || !result.hasMore) {
      return;
    }

    offset = result.nextOffset;
  }
}

export async function downloadKnownTrips(userId: string) {
  await downloadKnownOwnedTrips(userId);
  await downloadActiveCompanionTrips();
}
