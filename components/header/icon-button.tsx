import { colors, getColor, semanticColors } from "@/constants/theme";
import { type LucideIcon } from "lucide-react-native";
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from "react-native";

type HeaderIconButtonProps = {
  accessibilityLabel: string;
  icon: LucideIcon;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

export const HeaderIconButton = ({
  accessibilityLabel,
  icon: Icon,
  onPress,
  style,
}: HeaderIconButtonProps) => {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      hitSlop={4}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        style,
        pressed && styles.buttonPressed,
      ]}
    >
      <Icon
        color={semanticColors.textPrimary}
        size={22}
        strokeWidth={2.25}
      />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonPressed: {
    backgroundColor: getColor(colors.waffle, 0.16),
    transform: [{ scale: 0.96 }],
  },
});
