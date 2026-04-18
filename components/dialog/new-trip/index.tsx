import { Dialog } from "@/components/ui/dialog";
import { UIInputDate } from "@/components/ui/input/date";
import { UIInputText } from "@/components/ui/input/text";
import { borderRadiuses, colors, gaps, getColor } from "@/constants/theme";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

type DialogNewTripProps = {
  visible: boolean;
  onDismiss: () => void;
};

export const DialogNewTrip = ({ visible, onDismiss }: DialogNewTripProps) => {
  const [tripName, setTripName] = useState("");
  const [tripStartDate, setTripStartDate] = useState("");
  const [tripEndDate, setTripEndDate] = useState("");

  return (
    <Dialog visible={visible} onDismiss={onDismiss} title="New Trip">
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
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    gap: gaps.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: getColor(colors.whiteGrey),
    borderRadius: borderRadiuses.sm,
    padding: gaps.sm,
    fontSize: 16,
    color: getColor(colors.textDarkGrey),
  },
});
