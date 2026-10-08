import { actionSyncPendingLocalChecklistItems } from "@/lib/sqlite/model/checklist-item";
import { actionSyncPendingLocalDocuments } from "@/lib/sqlite/model/document";
import { actionSyncPendingLocalExpenses } from "@/lib/sqlite/model/expense";
import { actionSyncPendingLocalImages } from "@/lib/sqlite/model/image";
import { actionSyncPendingLocalNotes } from "@/lib/sqlite/model/note";
import { actionSyncPendingLocalPins } from "@/lib/sqlite/model/pin";
import { actionSyncPendingLocalReferenceLinks } from "@/lib/sqlite/model/reference-link";
import { actionSyncPendingLocalTrips } from "@/lib/sqlite/model/trip";

const SYNC_BATCH_SIZE = 25;

async function uploadPendingBatch(
  uploadBatch: (
    userId: string,
    limit: number,
  ) => Promise<{ hasMore: boolean }>,
  userId: string,
) {
  while (true) {
    const result = await uploadBatch(userId, SYNC_BATCH_SIZE);

    if (!result.hasMore) {
      return;
    }
  }
}

export async function uploadPendingChanges(userId: string) {
  await uploadPendingBatch(actionSyncPendingLocalTrips, userId);
  await uploadPendingBatch(actionSyncPendingLocalChecklistItems, userId);
  await uploadPendingBatch(actionSyncPendingLocalPins, userId);
  await uploadPendingBatch(actionSyncPendingLocalNotes, userId);
  await uploadPendingBatch(actionSyncPendingLocalReferenceLinks, userId);
  await uploadPendingBatch(actionSyncPendingLocalExpenses, userId);
  await uploadPendingBatch(actionSyncPendingLocalDocuments, userId);
  await uploadPendingBatch(actionSyncPendingLocalImages, userId);
}
