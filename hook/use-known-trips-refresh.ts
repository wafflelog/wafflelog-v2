import { useDataSync } from "@/hook/use-data-sync";
import { useCallback } from "react";

export function useKnownTripsRefresh() {
  const { downloadKnownTrips, downloadState, uploadPending, uploadState } =
    useDataSync();

  const refreshKnownTrips = useCallback(() => {
    void uploadPending().catch((error) => {
      console.error("Error uploading pending changes:", error);
    });
    void downloadKnownTrips().catch((error) => {
      console.error("Error refreshing trips:", error);
    });
  }, [downloadKnownTrips, uploadPending]);

  return {
    isRefreshing:
      uploadState.status === "syncing" || downloadState.status === "syncing",
    refreshKnownTrips,
  };
}
