import { Dialog } from "@/components/ui/dialog";
import { UIInputText } from "@/components/ui/input/text";
import { borderRadiuses, colors, gaps, getColor } from "@/constants/theme";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

type DialogNewChecklistItemProps = {
  visible: boolean;
  onDismiss: () => void;
};

export const DialogNewChecklistItem = ({
  visible,
  onDismiss,
}: DialogNewChecklistItemProps) => {
  const [checklistItemTitle, setChecklistItemTitle] = useState("");

  return (
    <Dialog
      visible={visible}
      onDismiss={onDismiss}
      title="New Checklist Item"
      size="md"
    >
      <View style={styles.content}>
        <UIInputText
          placeholder="Enter item"
          value={checklistItemTitle}
          onChange={setChecklistItemTitle}
          autoFocus
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
