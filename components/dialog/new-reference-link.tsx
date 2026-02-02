import { Dialog } from "@/components/ui/dialog";
import { UIInputText } from "@/components/ui/input/text";
import { borderRadiuses, colors, gaps, getColor } from "@/constants/theme";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

type DialogNewReferenceLinkProps = {
  visible: boolean;
  onDismiss: () => void;
};

export const DialogNewReferenceLink = ({
  visible,
  onDismiss,
}: DialogNewReferenceLinkProps) => {
  const [referenceLinkUrl, setReferenceLinkUrl] = useState("");
  const [referenceLinkCaption, setReferenceLinkCaption] = useState("");

  return (
    <Dialog
      visible={visible}
      onDismiss={onDismiss}
      title="New Reference Link"
      size="md"
    >
      <View style={styles.content}>
        <UIInputText
          placeholder="Enter URL"
          value={referenceLinkUrl}
          onChange={setReferenceLinkUrl}
          autoFocus
        />
        <UIInputText
          placeholder="Add caption (optional)"
          value={referenceLinkCaption}
          onChange={setReferenceLinkCaption}
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
