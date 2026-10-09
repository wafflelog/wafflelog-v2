import { useDataSync } from "@/hook/use-data-sync";
import { useCallback } from "react";

export function useKnownTripsRefresh() {
  const { downloadKnownTrips, downloadState } = useDataSync();

  const refreshKnownTrips = useCallback(() => {
    void downloadKnownTrips().catch((error) => {
      console.error("Error refreshing trips:", error);
    });
  }, [downloadKnownTrips]);

  return {
    isRefreshing: downloadState.status === "syncing",
    refreshKnownTrips,
  };
}
