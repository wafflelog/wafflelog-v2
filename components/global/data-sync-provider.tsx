import { useAuthSession } from "@/hook/use-auth-session";
import { runInitialDataSync } from "@/lib/data-sync/bootstrap";
import { DataSyncContext } from "@/lib/data-sync/context";
import { downloadKnownTrips as downloadKnownTripsFromRemote } from "@/lib/data-sync/download";
import {
  CHECKING_DATA_BOOTSTRAP_STATE,
  IDLE_DATA_SYNC_OPERATION_STATE,
  READY_DATA_BOOTSTRAP_STATE,
  type DataBootstrapState,
  type DataSyncOperationState,
} from "@/lib/data-sync/types";
import { uploadPendingChanges } from "@/lib/data-sync/upload";
import { sqlite } from "@/lib/sqlite/client";
import { isSameDatabaseFileName } from "@/lib/sqlite/database-path";
import { useQueryClient } from "@tanstack/react-query";
import { addDatabaseChangeListener } from "expo-sqlite";
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

const LOCAL_SYNC_STATUS_QUERIES = {
  trip: "select sync_status from trip where rowid = ?",
  checklist_item: "select sync_status from checklist_item where rowid = ?",
  pin: "select sync_status from pin where rowid = ?",
  pin_location: "select sync_status from pin_location where rowid = ?",
  note: "select sync_status from note where rowid = ?",
  reference_link: "select sync_status from reference_link where rowid = ?",
  expense: "select sync_status from expense where rowid = ?",
  document: "select sync_status from document where rowid = ?",
  image: "select sync_status from image where rowid = ?",
} as const;

const LOCAL_UPLOAD_DEBOUNCE_MS = 500;

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Data synchronization failed";
}

type ScopedSyncOperationState = {
  userId: string | null;
  operation: DataSyncOperationState;
};

type ScopedBootstrapState = {
  userId: string | null;
  operation: DataBootstrapState;
};

export function DataSyncProvider({ children }: PropsWithChildren) {
  const { session } = useAuthSession();
  const queryClient = useQueryClient();
  const userId = session?.user.id ?? null;
  const uploadPromiseRef = useRef<Promise<void> | null>(null);
  const uploadQueuedRef = useRef(false);
  const uploadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const downloadPromiseRef = useRef<Promise<void> | null>(null);
  const bootstrapPromiseRef = useRef<{
    userId: string;
    promise: Promise<void>;
  } | null>(null);
  const [scopedBootstrapState, setScopedBootstrapState] =
    useState<ScopedBootstrapState>({
      userId: null,
      operation: READY_DATA_BOOTSTRAP_STATE,
    });
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
  const bootstrapState = !userId
    ? READY_DATA_BOOTSTRAP_STATE
    : scopedBootstrapState.userId === userId
      ? scopedBootstrapState.operation
      : CHECKING_DATA_BOOTSTRAP_STATE;

  const invalidateLocalSyncQueries = useCallback(
    () =>
      Promise.all(
        LOCAL_SYNC_QUERY_KEYS.map((queryKey) =>
          queryClient.invalidateQueries({ queryKey }),
        ),
      ).then(() => undefined),
    [queryClient],
  );

  const uploadPending = useCallback(function runUploadPending(): Promise<void> {
    if (!userId) {
      return Promise.resolve();
    }

    if (uploadPromiseRef.current) {
      uploadQueuedRef.current = true;

      return uploadPromiseRef.current.then(() => {
        if (!uploadQueuedRef.current) {
          return;
        }

        uploadQueuedRef.current = false;
        return runUploadPending();
      });
    }

    uploadQueuedRef.current = false;

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
      .then(async () => {
        await invalidateLocalSyncQueries();
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
  }, [invalidateLocalSyncQueries, userId]);

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

    const downloadPromise = downloadKnownTripsFromRemote()
      .then(async () => {
        await invalidateLocalSyncQueries();
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
  }, [invalidateLocalSyncQueries, userId]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    let isSubscribed = true;
    const subscription = addDatabaseChangeListener((event) => {
      const isCurrentDatabase = isSameDatabaseFileName(
        event.databaseFilePath,
        sqlite.databasePath,
      );

      if (!isCurrentDatabase) {
        return;
      }

      const statusQuery =
        LOCAL_SYNC_STATUS_QUERIES[
          event.tableName as keyof typeof LOCAL_SYNC_STATUS_QUERIES
        ];

      if (!statusQuery) {
        return;
      }

      void sqlite
        .getFirstAsync<{ sync_status: string }>(statusQuery, event.rowId)
        .then((row) => {
          if (!isSubscribed || row?.sync_status !== "pending") {
            return;
          }

          if (uploadTimerRef.current) {
            clearTimeout(uploadTimerRef.current);
          }

          uploadTimerRef.current = setTimeout(() => {
            uploadTimerRef.current = null;
            void uploadPending().catch((error) => {
              console.error("Error uploading local changes:", error);
            });
          }, LOCAL_UPLOAD_DEBOUNCE_MS);
        })
        .catch((error) => {
          console.error("Error inspecting local change for upload:", error);
        });
    });

    return () => {
      isSubscribed = false;
      subscription.remove();

      if (uploadTimerRef.current) {
        clearTimeout(uploadTimerRef.current);
        uploadTimerRef.current = null;
      }
    };
  }, [uploadPending, userId]);

  const retryBootstrap = useCallback(() => {
    if (!userId) {
      return Promise.resolve();
    }

    if (bootstrapPromiseRef.current?.userId === userId) {
      return bootstrapPromiseRef.current.promise;
    }

    setScopedBootstrapState({
      userId,
      operation: CHECKING_DATA_BOOTSTRAP_STATE,
    });

    const bootstrapPromise = runInitialDataSync(userId, {
      uploadPending,
      downloadKnownTrips,
      onStageChange: (status) => {
        setScopedBootstrapState({
          userId,
          operation: { status, error: null },
        });
      },
    })
      .then((didBootstrap) => {
        setScopedBootstrapState((state) =>
          state.userId === userId
            ? { userId, operation: READY_DATA_BOOTSTRAP_STATE }
            : state,
        );

        if (!didBootstrap) {
          void uploadPending().catch((error) => {
            console.error("Error uploading pending local changes:", error);
          });
        }
      })
      .catch((error) => {
        setScopedBootstrapState((state) =>
          state.userId === userId
            ? {
                userId,
                operation: {
                  status: "failed",
                  error: getErrorMessage(error),
                },
              }
            : state,
        );
        throw error;
      })
      .finally(() => {
        if (bootstrapPromiseRef.current?.promise === bootstrapPromise) {
          bootstrapPromiseRef.current = null;
        }
      });

    bootstrapPromiseRef.current = { userId, promise: bootstrapPromise };
    return bootstrapPromise;
  }, [downloadKnownTrips, uploadPending, userId]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    void retryBootstrap().catch((error) => {
      console.error("Error running initial data synchronization:", error);
    });
  }, [retryBootstrap, userId]);

  const contextValue = useMemo(
    () => ({
      bootstrapState,
      uploadState,
      downloadState,
      retryBootstrap,
      uploadPending,
      downloadKnownTrips,
    }),
    [
      bootstrapState,
      downloadKnownTrips,
      downloadState,
      retryBootstrap,
      uploadPending,
      uploadState,
    ],
  );

  return (
    <DataSyncContext.Provider value={contextValue}>
      {children}
    </DataSyncContext.Provider>
  );
}
