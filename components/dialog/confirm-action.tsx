import { View } from "react-native";

import { Dialog } from "@/components/ui/dialog";
import { TitleRegular } from "@/components/title/regular";
import { colors, gaps } from "@/constants/theme";

type ConfirmActionDialogProps = {
  visible: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onDismiss: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: "primary" | "danger";
  isPending?: boolean;
};

export const ConfirmActionDialog = ({
  visible,
  title,
  message,
  onConfirm,
  onDismiss,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmVariant = "danger",
  isPending = false,
}: ConfirmActionDialogProps) => {
  return (
    <Dialog
      visible={visible}
      title={title}
      onDismiss={onDismiss}
      onConfirm={onConfirm}
      confirmText={isPending ? "Working..." : confirmText}
      cancelText={cancelText}
      confirmVariant={confirmVariant}
      size="xs"
    >
      <View style={{ gap: gaps.md }}>
        <TitleRegular size="sm" color={colors.textDarkGrey}>
          {message}
        </TitleRegular>
      </View>
    </Dialog>
  );
};
