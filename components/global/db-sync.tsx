import { useAuthSession } from "@/hook/use-auth-session";
import { actionSyncPendingLocalChecklistItems } from "@/lib/sqlite/model/checklist-item";
import { actionSyncPendingLocalExpenses } from "@/lib/sqlite/model/expense";
import { actionSyncPendingLocalNotes } from "@/lib/sqlite/model/note";
import { actionSyncPendingLocalPins } from "@/lib/sqlite/model/pin";
import { actionSyncPendingLocalReferenceLinks } from "@/lib/sqlite/model/reference-link";
import { actionSyncPendingLocalTrips } from "@/lib/sqlite/model/trip";
import { useEffect, useRef } from "react";

const SYNC_BATCH_SIZE = 25;

async function runPendingUploadSync(userId: string) {
  while (true) {
    const tripResult = await actionSyncPendingLocalTrips(userId, SYNC_BATCH_SIZE);

    if (!tripResult.hasMore) {
      break;
    }
  }

  while (true) {
    const checklistItemResult = await actionSyncPendingLocalChecklistItems(
      userId,
      SYNC_BATCH_SIZE,
    );

    if (!checklistItemResult.hasMore) {
      break;
    }
  }

  while (true) {
    const pinResult = await actionSyncPendingLocalPins(userId, SYNC_BATCH_SIZE);

    if (!pinResult.hasMore) {
      break;
    }
  }

  while (true) {
    const noteResult = await actionSyncPendingLocalNotes(
      userId,
      SYNC_BATCH_SIZE,
    );

    if (!noteResult.hasMore) {
      break;
    }
  }

  while (true) {
    const referenceLinkResult = await actionSyncPendingLocalReferenceLinks(
      userId,
      SYNC_BATCH_SIZE,
    );

    if (!referenceLinkResult.hasMore) {
      break;
    }
  }

  while (true) {
    const expenseResult = await actionSyncPendingLocalExpenses(
      userId,
      SYNC_BATCH_SIZE,
    );

    if (!expenseResult.hasMore) {
      break;
    }
  }
}

export const GlobalDbSync = () => {
  const { session } = useAuthSession();
  const isSyncRunningRef = useRef(false);

  useEffect(() => {
    if (!session?.user.id || isSyncRunningRef.current) {
      return;
    }

    isSyncRunningRef.current = true;

    void runPendingUploadSync(session.user.id)
      .catch((error) => {
        console.error("Error running pending upload sync:", error);
      })
      .finally(() => {
        isSyncRunningRef.current = false;
      });
  }, [session?.user.id]);

  return null;
};
