import { useAuthSession } from "@/hook/use-auth-session";
import { actionSyncPendingLocalPins } from "@/lib/sqlite/model/pin";
import { actionSyncPendingLocalTrips } from "@/lib/sqlite/model/trip";
import { useEffect } from "react";

const SYNC_BATCH_SIZE = 25;

async function runPendingUploadSync(userId: string) {
  while (true) {
    const tripResult = await actionSyncPendingLocalTrips(userId, SYNC_BATCH_SIZE);

    if (!tripResult.hasMore) {
      break;
    }
  }

  while (true) {
    const pinResult = await actionSyncPendingLocalPins(userId, SYNC_BATCH_SIZE);

    if (!pinResult.hasMore) {
      break;
    }
  }
}

export const GlobalDbSync = () => {
  const { session } = useAuthSession();

  useEffect(() => {
    if (!session?.user.id) {
      return;
    }

    void runPendingUploadSync(session.user.id).catch((error) => {
      console.error("Error running pending upload sync:", error);
    });
  }, [session?.user.id]);

  return null;
};
