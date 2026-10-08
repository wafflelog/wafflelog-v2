import { DataSyncContext } from "@/lib/data-sync/context";
import { useContext } from "react";

export function useDataSync() {
  const context = useContext(DataSyncContext);

  if (!context) {
    throw new Error("useDataSync must be used within DataSyncProvider");
  }

  return context;
}
