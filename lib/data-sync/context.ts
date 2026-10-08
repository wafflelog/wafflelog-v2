import {
  type DataBootstrapState,
  type DataSyncOperationState,
} from "@/lib/data-sync/types";
import { createContext } from "react";

export type DataSyncContextValue = {
  bootstrapState: DataBootstrapState;
  uploadState: DataSyncOperationState;
  downloadState: DataSyncOperationState;
  retryBootstrap: () => Promise<void>;
  uploadPending: () => Promise<void>;
  downloadKnownTrips: () => Promise<void>;
};

export const DataSyncContext = createContext<DataSyncContextValue | null>(null);
