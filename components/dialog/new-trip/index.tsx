import { Dialog } from "@/components/ui/dialog";
import { UIInputDate } from "@/components/ui/input/date";
import { UIInputText } from "@/components/ui/input/text";
import { gaps } from "@/constants/theme";
import { useSystemMessage } from "@/hook/use-system-message";
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

  const handleConfirm = () => {
    const result = newTripFormSchema.safeParse({
      tripName,
      tripStartDate,
      tripEndDate,
    });

    console.log("startDate:", tripStartDate);
    console.log("endDate:", tripEndDate);
    console.log("Validation result:", result);

    if (!result.success) {
      const message =
        result.error.issues[0]?.message ??
        "Check your trip details and try again.";
      showMessage(message, "error");
      return;
    }

    // result.data is validated; wire persistence / navigation here
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
