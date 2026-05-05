import { Dialog } from "@/components/ui/dialog";
import { UIInputDate } from "@/components/ui/input/date";
import { UIInputText } from "@/components/ui/input/text";
import { gaps } from "@/constants/theme";
import { useAuthSession } from "@/hook/use-auth-session";
import { useSystemMessage } from "@/hook/use-system-message";
import {
  actionCreateLocalTrip,
  actionSyncLocalTrip,
} from "@/lib/sqlite/model/trip";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { newTripFormSchema } from "./schema";

type DialogNewTripProps = {
  visible: boolean;
  onDismiss: () => void;
};

export const DialogNewTrip = ({ visible, onDismiss }: DialogNewTripProps) => {
  const { session } = useAuthSession();
  const queryClient = useQueryClient();
  const [tripName, setTripName] = useState("");
  const [tripStartDate, setTripStartDate] = useState("");
  const [tripEndDate, setTripEndDate] = useState("");
  const { showMessage, SystemMessageModal } = useSystemMessage();
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
        title="New Trip"
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
