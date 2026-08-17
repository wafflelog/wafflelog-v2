import { TitleRegular } from "@/components/title/regular";
import {
  borderRadiuses,
  colors,
  gaps,
  semanticColors,
} from "@/constants/theme";
import { ArrowRight } from "lucide-react-native";
import { ActivityIndicator, Pressable, StyleSheet } from "react-native";

type AuthSubmitButtonProps = {
  label: string;
  pendingLabel: string;
  isPending: boolean;
  onPress: () => void;
};

export function AuthSubmitButton({
  label,
  pendingLabel,
  isPending,
  onPress,
}: AuthSubmitButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        pressed && !isPending && styles.buttonPressed,
        isPending && styles.buttonDisabled,
      ]}
      onPress={onPress}
      disabled={isPending}
      accessibilityRole="button"
      accessibilityState={{ disabled: isPending, busy: isPending }}
    >
      {isPending ? (
        <ActivityIndicator
          size="small"
          color={semanticColors.primaryActionContent}
        />
      ) : null}
      <TitleRegular size="md" color={colors.textDarkGrey} weight="700">
        {isPending ? pendingLabel : label}
      </TitleRegular>
      {!isPending ? (
        <ArrowRight size={20} color={semanticColors.primaryActionContent} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: gaps.sm,
    paddingHorizontal: gaps.md,
    borderRadius: borderRadiuses.md,
    backgroundColor: semanticColors.primaryAction,
    shadowColor: semanticColors.primaryAction,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
  },
  buttonPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.99 }],
  },
  buttonDisabled: {
    opacity: 0.65,
  },
});
