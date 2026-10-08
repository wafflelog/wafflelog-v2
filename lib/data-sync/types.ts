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

export type DataBootstrapStatus =
  | "checking"
  | "syncing"
  | "failed"
  | "ready";

export type DataBootstrapState = {
  status: DataBootstrapStatus;
  error: string | null;
};

export const CHECKING_DATA_BOOTSTRAP_STATE: DataBootstrapState = {
  status: "checking",
  error: null,
};

export const READY_DATA_BOOTSTRAP_STATE: DataBootstrapState = {
  status: "ready",
  error: null,
};
