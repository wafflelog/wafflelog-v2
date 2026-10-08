export type DataSyncOperationStatus =
  | "idle"
  | "syncing"
  | "success"
  | "error";

export type DataSyncOperationState = {
  status: DataSyncOperationStatus;
  lastSucceededAt: string | null;
  error: string | null;
};

export const IDLE_DATA_SYNC_OPERATION_STATE: DataSyncOperationState = {
  status: "idle",
  lastSucceededAt: null,
  error: null,
};
