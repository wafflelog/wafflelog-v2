import { useDataSync } from "@/hook/use-data-sync";
import { useSystemMessage } from "@/hook/use-system-message";
import { useEffect, useRef } from "react";

export function GlobalDataSyncMessages() {
  const { bootstrapState, downloadState, uploadState } = useDataSync();
  const { showMessage, SystemMessageModal } = useSystemMessage();
  const previousUploadStatus = useRef(uploadState.status);
  const previousDownloadStatus = useRef(downloadState.status);

  useEffect(() => {
    const hasJustFailed =
      previousUploadStatus.current !== "error" &&
      uploadState.status === "error";

    previousUploadStatus.current = uploadState.status;

    if (bootstrapState.status === "ready" && hasJustFailed) {
      showMessage(
        "Some changes couldn't be synced. Please try again later.",
        "error",
      );
    }
  }, [bootstrapState.status, showMessage, uploadState.status]);

  useEffect(() => {
    const hasJustFailed =
      previousDownloadStatus.current !== "error" &&
      downloadState.status === "error";

    previousDownloadStatus.current = downloadState.status;

    if (bootstrapState.status === "ready" && hasJustFailed) {
      showMessage(
        "Trips couldn't be refreshed. Check your connection and try again.",
        "error",
      );
    }
  }, [bootstrapState.status, downloadState.status, showMessage]);

  return <SystemMessageModal />;
}
