import {
  actionGetInitialDownloadCompletedAt,
  actionMarkInitialDownloadCompleted,
} from "@/lib/sqlite/model/data-sync-state";

type InitialDataSyncDependencies = {
  uploadPending: () => Promise<void>;
  downloadKnownTrips: () => Promise<void>;
  onStageChange?: (stage: "checking" | "syncing") => void;
};

export async function runInitialDataSync(
  userId: string,
  dependencies: InitialDataSyncDependencies,
) {
  dependencies.onStageChange?.("checking");

  const completedAt = await actionGetInitialDownloadCompletedAt(userId);

  if (completedAt) {
    return false;
  }

  dependencies.onStageChange?.("syncing");
  await dependencies.uploadPending();
  await dependencies.downloadKnownTrips();
  await actionMarkInitialDownloadCompleted(userId);

  return true;
}
