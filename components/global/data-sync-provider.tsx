import { useAuthSession } from "@/hook/use-auth-session";
import { DataSyncContext } from "@/lib/data-sync/context";
import { downloadKnownTrips as downloadKnownTripsFromRemote } from "@/lib/data-sync/download";
import {
  IDLE_DATA_SYNC_OPERATION_STATE,
  type DataSyncOperationState,
} from "@/lib/data-sync/types";
import { uploadPendingChanges } from "@/lib/data-sync/upload";
import { useQueryClient } from "@tanstack/react-query";
import {
  type PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const LOCAL_SYNC_QUERY_KEYS = [
  ["local-trips"],
  ["local-trip"],
  ["local-pins"],
  ["local-pin"],
  ["local-pin-locations"],
  ["local-pin-location"],
  ["local-checklist-items"],
  ["local-notes"],
  ["local-reference-links"],
  ["local-trip-reference-links"],
  ["local-trip-expenses"],
  ["local-pin-expenses"],
  ["local-trip-documents"],
  ["local-pin-documents"],
  ["local-trip-images"],
  ["local-pin-images"],
] as const;

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Data synchronization failed";
}

type ScopedSyncOperationState = {
  userId: string | null;
  operation: DataSyncOperationState;
};

export function DataSyncProvider({ children }: PropsWithChildren) {
  const { session } = useAuthSession();
  const queryClient = useQueryClient();
  const userId = session?.user.id ?? null;
  const uploadPromiseRef = useRef<Promise<void> | null>(null);
  const downloadPromiseRef = useRef<Promise<void> | null>(null);
  const [scopedUploadState, setScopedUploadState] =
    useState<ScopedSyncOperationState>({
      userId: null,
      operation: IDLE_DATA_SYNC_OPERATION_STATE,
    });
  const [scopedDownloadState, setScopedDownloadState] =
    useState<ScopedSyncOperationState>({
      userId: null,
      operation: IDLE_DATA_SYNC_OPERATION_STATE,
    });
  const uploadState =
    scopedUploadState.userId === userId
      ? scopedUploadState.operation
      : IDLE_DATA_SYNC_OPERATION_STATE;
  const downloadState =
    scopedDownloadState.userId === userId
      ? scopedDownloadState.operation
      : IDLE_DATA_SYNC_OPERATION_STATE;

  const uploadPending = useCallback(() => {
    if (!userId) {
      return Promise.resolve();
    }

    if (uploadPromiseRef.current) {
      return uploadPromiseRef.current;
    }

    setScopedUploadState((state) => ({
      userId,
      operation: {
        ...(state.userId === userId
          ? state.operation
          : IDLE_DATA_SYNC_OPERATION_STATE),
        status: "syncing",
        error: null,
      },
    }));

    const uploadPromise = uploadPendingChanges(userId)
      .then(() => {
        setScopedUploadState((state) => {
          if (state.userId !== userId) {
            return state;
          }

          return {
            userId,
            operation: {
              status: "success",
              lastSucceededAt: new Date().toISOString(),
              error: null,
            },
          };
        });
      })
      .catch((error) => {
        setScopedUploadState((state) => {
          if (state.userId !== userId) {
            return state;
          }

          return {
            userId,
            operation: {
              ...state.operation,
              status: "error",
              error: getErrorMessage(error),
            },
          };
        });
        throw error;
      })
      .finally(() => {
        uploadPromiseRef.current = null;
      });

    uploadPromiseRef.current = uploadPromise;
    return uploadPromise;
  }, [userId]);

  const downloadKnownTrips = useCallback(() => {
    if (!userId) {
      return Promise.resolve();
    }

    if (downloadPromiseRef.current) {
      return downloadPromiseRef.current;
    }

    setScopedDownloadState((state) => ({
      userId,
      operation: {
        ...(state.userId === userId
          ? state.operation
          : IDLE_DATA_SYNC_OPERATION_STATE),
        status: "syncing",
        error: null,
      },
    }));

    const downloadPromise = downloadKnownTripsFromRemote(userId)
      .then(async () => {
        await Promise.all(
          LOCAL_SYNC_QUERY_KEYS.map((queryKey) =>
            queryClient.invalidateQueries({ queryKey }),
          ),
        );
        setScopedDownloadState((state) => {
          if (state.userId !== userId) {
            return state;
          }

          return {
            userId,
            operation: {
              status: "success",
              lastSucceededAt: new Date().toISOString(),
              error: null,
            },
          };
        });
      })
      .catch((error) => {
        setScopedDownloadState((state) => {
          if (state.userId !== userId) {
            return state;
          }

          return {
            userId,
            operation: {
              ...state.operation,
              status: "error",
              error: getErrorMessage(error),
            },
          };
        });
        throw error;
      })
      .finally(() => {
        downloadPromiseRef.current = null;
      });

    downloadPromiseRef.current = downloadPromise;
    return downloadPromise;
  }, [queryClient, userId]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    void uploadPending()
      .then(downloadKnownTrips)
      .catch((error) => {
        console.error("Error running initial data synchronization:", error);
      });
  }, [downloadKnownTrips, uploadPending, userId]);

  const contextValue = useMemo(
    () => ({
      uploadState,
      downloadState,
      uploadPending,
      downloadKnownTrips,
    }),
    [downloadKnownTrips, downloadState, uploadPending, uploadState],
  );

  return (
    <DataSyncContext.Provider value={contextValue}>
      {children}
    </DataSyncContext.Provider>
  );
}
