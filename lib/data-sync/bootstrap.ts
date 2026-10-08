import {
  actionGetInitialDownloadCompletedAt,
  actionMarkInitialDownloadCompleted,
} from "@/lib/sqlite/model/data-sync-state";

type InitialDataSyncDependencies = {
  uploadPending: () => Promise<void>;
  downloadKnownTrips: () => Promise<void>;
};

export async function runInitialDataSync(
  userId: string,
  dependencies: InitialDataSyncDependencies,
) {
  await dependencies.uploadPending();

  const completedAt = await actionGetInitialDownloadCompletedAt(userId);

  if (completedAt) {
    return false;
  }

  await dependencies.downloadKnownTrips();
  await actionMarkInitialDownloadCompleted(userId);

  return true;
}
