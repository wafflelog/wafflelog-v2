import {
  actionPullActiveCompanionTrips,
  actionPullOwnedTrips,
} from "@/lib/sqlite/model/companion-trip-sync";
import { actionReconcileLocalCompanionAccess } from "@/lib/sqlite/model/companion-access";

const SYNC_BATCH_SIZE = 25;

async function downloadKnownOwnedTrips() {
  let offset = 0;

  while (true) {
    const result = await actionPullOwnedTrips(SYNC_BATCH_SIZE, offset);

    if (result.processed === 0 || !result.hasMore) {
      return;
    }

    offset = result.nextOffset;
  }
}

async function downloadActiveCompanionTrips(userId: string) {
  const activeMemberships = await actionReconcileLocalCompanionAccess(userId);
  let offset = 0;

  while (true) {
    const result = await actionPullActiveCompanionTrips(
      SYNC_BATCH_SIZE,
      offset,
      activeMemberships,
    );

    if (result.processed === 0 || !result.hasMore) {
      return;
    }

    offset = result.nextOffset;
  }
}

export async function downloadKnownTrips(userId: string) {
  await downloadKnownOwnedTrips();
  await downloadActiveCompanionTrips(userId);
}
