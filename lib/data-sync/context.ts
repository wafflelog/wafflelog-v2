import { type DataSyncOperationState } from "@/lib/data-sync/types";
import { createContext } from "react";

export type DataSyncContextValue = {
  uploadState: DataSyncOperationState;
  downloadState: DataSyncOperationState;
  uploadPending: () => Promise<void>;
  downloadKnownTrips: () => Promise<void>;
};

export const DataSyncContext = createContext<DataSyncContextValue | null>(null);
