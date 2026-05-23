import { Dialog } from "@/components/ui/dialog";
import { UIInputDate } from "@/components/ui/input/date";
import { UIInputText } from "@/components/ui/input/text";
import { gaps } from "@/constants/theme";
import { useAuthSession } from "@/hook/use-auth-session";
import { useSystemMessage } from "@/hook/use-system-message";
import {
  actionCreateLocalTrip,
  actionSyncLocalTrip,
  actionUpdateLocalTrip,
} from "@/lib/sqlite/model/trip";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { newTripFormSchema } from "./schema";

type DialogNewTripProps = {
  visible: boolean;
  onDismiss: () => void;
  mode?: "create" | "edit";
  initialTrip?: {
    id: string;
    title: string;
    startDate: string;
    endDate: string;
  };
};

export const DialogNewTrip = ({
  visible,
  onDismiss,
  mode = "create",
  initialTrip,
}: DialogNewTripProps) => {
  const { session } = useAuthSession();
  const queryClient = useQueryClient();
  const [tripName, setTripName] = useState("");
  const [tripStartDate, setTripStartDate] = useState("");
  const [tripEndDate, setTripEndDate] = useState("");
  const { showMessage, SystemMessageModal } = useSystemMessage();
  const isEditMode = mode === "edit";

  useEffect(() => {
    if (!visible) {
      return;
    }

    if (isEditMode && initialTrip) {
      setTripName(initialTrip.title);
      setTripStartDate(initialTrip.startDate);
      setTripEndDate(initialTrip.endDate);
      return;
    }

    setTripName("");
    setTripStartDate("");
    setTripEndDate("");
  }, [visible, isEditMode, initialTrip]);

  const createTripMutation = useMutation({
    mutationFn: actionCreateLocalTrip,
    onSuccess: (localTrip) => {
      queryClient.invalidateQueries({
        queryKey: ["local-trips", session?.user.id],
      });
      void actionSyncLocalTrip(localTrip)
        .catch((error) => {
          console.error("Error syncing trip:", error);
          showMessage("Trip saved locally, sync pending", "info");
        })
        .finally(() => {
          queryClient.invalidateQueries({
            queryKey: ["local-trips", session?.user.id],
          });
        });
      setTripName("");
      setTripStartDate("");
      setTripEndDate("");
      onDismiss();
      showMessage("Trip saved locally", "info");
    },
    onError: (error) => {
      console.error("Error creating trip:", error);
      const message =
        error instanceof Error ? error.message : "Failed to create trip";
      showMessage(message, "error");
    },
  });

  const updateTripMutation = useMutation({
    mutationFn: actionUpdateLocalTrip,
    onSuccess: async (localTrip) => {
      if (session?.user.id) {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: ["local-trip", localTrip.id, session.user.id],
          }),
          queryClient.invalidateQueries({
            queryKey: ["local-trips", session.user.id],
          }),
          queryClient.invalidateQueries({
            queryKey: ["local-pins", localTrip.id, session.user.id],
          }),
        ]);
      }

      onDismiss();
      showMessage("Trip updated locally", "info");

      try {
        await actionSyncLocalTrip(localTrip);

        if (session?.user.id) {
          await Promise.all([
            queryClient.invalidateQueries({
              queryKey: ["local-trip", localTrip.id, session.user.id],
            }),
            queryClient.invalidateQueries({
              queryKey: ["local-trips", session.user.id],
            }),
          ]);
        }
      } catch (error) {
        console.error("Error syncing trip:", error);
      }
    },
    onError: (error) => {
      console.error("Error updating trip:", error);
      const message =
        error instanceof Error ? error.message : "Failed to update trip";
      showMessage(message, "error");
    },
  });

  const handleConfirm = () => {
    if (!session?.user.id) {
      showMessage("You must be signed in to create a trip", "error");
      return;
    }

    const result = newTripFormSchema.safeParse({
      tripName,
      tripStartDate,
      tripEndDate,
    });

    if (!result.success) {
      const message =
        result.error.issues[0]?.message ??
        "Check your trip details and try again.";
      showMessage(message, "error");
      return;
    }

    if (isEditMode) {
      if (!initialTrip) {
        showMessage("Trip not found", "error");
        return;
      }

      updateTripMutation.mutate({
        id: initialTrip.id,
        userId: session.user.id,
        title: result.data.tripName,
        startDate: result.data.tripStartDate,
        endDate: result.data.tripEndDate,
      });
      return;
    }

    createTripMutation.mutate({
      userId: session.user.id,
      title: result.data.tripName,
      startDate: result.data.tripStartDate,
      endDate: result.data.tripEndDate,
    });
  };

  return (
    <>
      <Dialog
        visible={visible}
        onDismiss={onDismiss}
        title={isEditMode ? "Edit Trip" : "New Trip"}
        confirmText={isEditMode ? "Save" : "Create"}
        onConfirm={handleConfirm}
      >
        <View style={styles.content}>
          <UIInputText
            placeholder="Enter trip name!"
            value={tripName}
            onChange={setTripName}
            autoFocus
          />
          <UIInputDate
            placeholder="Enter trip start date"
            value={tripStartDate}
            onChange={setTripStartDate}
          />
          <UIInputDate
            placeholder="Enter trip end date"
            value={tripEndDate}
            onChange={setTripEndDate}
          />
        </View>
        <SystemMessageModal />
      </Dialog>
    </>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    gap: gaps.sm,
  },
});
