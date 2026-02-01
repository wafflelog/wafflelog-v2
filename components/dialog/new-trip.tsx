import { TitleRegular } from "@/components/title/regular";
import { Dialog } from "@/components/ui/dialog";
import { UIInputDate } from "@/components/ui/input/date";
import { UIInputText } from "@/components/ui/input/text";
import { borderRadiuses, colors, gaps, getColor } from "@/constants/theme";
import { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

type DialogNewTripProps = {
  visible: boolean;
  onDismiss: () => void;
};

export const DialogNewTrip = ({ visible, onDismiss }: DialogNewTripProps) => {
  const [tripName, setTripName] = useState("");
  const [tripStartDate, setTripStartDate] = useState("");
  const [tripEndDate, setTripEndDate] = useState("");

  const handleConfirm = () => {
    // TODO: Handle trip creation
    console.log("Creating trip:", tripName);
    onDismiss();
  };

  return (
    <Dialog visible={visible} onDismiss={onDismiss}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TitleRegular size="lg" weight="600" color={colors.textDarkGrey}>
            New Trip
          </TitleRegular>
        </View>

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

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={onDismiss}
          >
            <TitleRegular size="sm" weight="600" color={colors.textDarkGrey}>
              Cancel
            </TitleRegular>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.createButton]}
            onPress={handleConfirm}
          >
            <TitleRegular size="sm" weight="600" color={colors.white}>
              Create
            </TitleRegular>
          </TouchableOpacity>
        </View>
      </View>
    </Dialog>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: gaps.lg,
  },
  header: {
    marginBottom: gaps.lg,
    paddingBottom: gaps.md,
    borderBottomWidth: 1,
    borderBottomColor: getColor(colors.whiteGrey),
  },
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
  actions: {
    flexDirection: "row",
    gap: gaps.sm,
    marginTop: gaps.lg,
    justifyContent: "flex-end",
  },
  button: {
    paddingVertical: gaps.sm,
    paddingHorizontal: gaps.lg,
    borderRadius: borderRadiuses.sm,
    minWidth: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: getColor(colors.whiteGrey, 0.5),
  },
  createButton: {
    backgroundColor: getColor(colors.orange),
  },
});
