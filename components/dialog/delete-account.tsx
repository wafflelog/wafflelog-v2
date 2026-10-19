import { ConfirmActionDialog } from "@/components/dialog/confirm-action";
import { UIText } from "@/components/ui/text";
import {
  borderRadiuses,
  colors,
  fontSizes,
  gaps,
  getColor,
} from "@/constants/theme";
import { matchesAccountDeletionConfirmation } from "@/lib/account/delete-account-confirmation";
import { getFontFamily } from "@/lib/helper/utils";
import { useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";

type DeleteAccountDialogProps = {
  visible: boolean;
  isPending: boolean;
  onConfirm: () => void;
  onDismiss: () => void;
};

export function DeleteAccountDialog({
  visible,
  isPending,
  onConfirm,
  onDismiss,
}: DeleteAccountDialogProps) {
  const [confirmation, setConfirmation] = useState("");
  const confirmationMatches = matchesAccountDeletionConfirmation(confirmation);
  const showMismatch = confirmation.length > 0 && !confirmationMatches;

  const handleDismiss = () => {
    setConfirmation("");
    onDismiss();
  };

  return (
    <ConfirmActionDialog
      visible={visible}
      title="Delete account"
      message="This permanently deletes your account, trips you own, planning sessions, and uploaded files. This cannot be undone."
      messageColor={colors.red}
      confirmText="Delete account"
      confirmDisabled={!confirmationMatches}
      onDismiss={handleDismiss}
      onConfirm={onConfirm}
      isPending={isPending}
      confirmVariant="danger"
    >
      <View style={styles.confirmationField}>
        <UIText style={styles.instruction}>
          Type <UIText weight="700">delete</UIText> to confirm.
        </UIText>
        <TextInput
          accessibilityLabel="Confirmation username"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isPending}
          onChangeText={setConfirmation}
          onSubmitEditing={confirmationMatches ? onConfirm : undefined}
          placeholder="Type delete"
          placeholderTextColor={getColor(colors.paleGrey)}
          returnKeyType="done"
          selectionColor={getColor(colors.waffle)}
          style={[styles.input, showMismatch && styles.inputMismatch]}
          value={confirmation}
        />
        {showMismatch ? (
          <UIText style={styles.mismatch}>Enter delete to continue.</UIText>
        ) : null}
      </View>
    </ConfirmActionDialog>
  );
}

const styles = StyleSheet.create({
  confirmationField: {
    gap: gaps.xs,
  },
  instruction: {
    color: getColor(colors.textDarkGrey),
    fontSize: fontSizes.sm,
    lineHeight: 20,
  },
  input: {
    minHeight: 48,
    paddingHorizontal: gaps.sm,
    borderWidth: 1,
    borderColor: getColor(colors.whiteGrey),
    borderRadius: borderRadiuses.sm,
    color: getColor(colors.textDarkGrey),
    fontFamily: getFontFamily("400"),
    fontSize: fontSizes.md,
  },
  inputMismatch: {
    borderColor: getColor(colors.red),
  },
  mismatch: {
    color: getColor(colors.red),
    fontSize: fontSizes.xs,
    lineHeight: 17,
  },
});
