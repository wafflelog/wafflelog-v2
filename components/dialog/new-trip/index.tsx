import { Dialog } from "@/components/ui/dialog";
import { UIInputDate } from "@/components/ui/input/date";
import { UIInputText } from "@/components/ui/input/text";
import { gaps } from "@/constants/theme";
import { useSystemMessage } from "@/hook/use-system-message";
import { createTrip } from "@/lib/supabase/actions";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { newTripFormSchema } from "./schema";

type DialogNewTripProps = {
  visible: boolean;
  onDismiss: () => void;
};

export const DialogNewTrip = ({ visible, onDismiss }: DialogNewTripProps) => {
  const [tripName, setTripName] = useState("");
  const [tripStartDate, setTripStartDate] = useState("");
  const [tripEndDate, setTripEndDate] = useState("");
  const { showMessage, SystemMessageModal } = useSystemMessage();
  const createTripMutation = useMutation({
    mutationFn: createTrip,
    onSuccess: () => {
      setTripName("");
      setTripStartDate("");
      setTripEndDate("");
      onDismiss();
      showMessage("Trip created", "info");
    },
    onError: (error) => {
      console.error("Error creating trip:", error);
      const message =
        error instanceof Error ? error.message : "Failed to create trip";
      showMessage(message, "error");
    },
  });

  const handleConfirm = () => {
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
    console.log("Creating trip with:", result.data);

    createTripMutation.mutate({
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
      </Dialog>
      <SystemMessageModal />
    </>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    gap: gaps.sm,
  },
});
