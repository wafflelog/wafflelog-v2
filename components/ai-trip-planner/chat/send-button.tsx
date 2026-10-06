import { borderRadiuses, colors, getColor } from "@/constants/theme";
import { ArrowUp } from "lucide-react-native";
import { StyleSheet, TouchableOpacity } from "react-native";

type AiPlannerSendButtonProps = {
  disabled: boolean;
  accessibilityLabel: string;
  onPress: () => void;
};

export function AiPlannerSendButton({
  disabled,
  accessibilityLabel,
  onPress,
}: AiPlannerSendButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.buttonDisabled]}
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
    >
      <ArrowUp size={20} color={getColor(colors.white)} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 38,
    height: 38,
    borderRadius: borderRadiuses.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: getColor(colors.purple),
  },
  buttonDisabled: { backgroundColor: getColor(colors.paleGrey) },
});
