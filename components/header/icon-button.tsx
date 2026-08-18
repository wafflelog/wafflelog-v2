import { colors, getColor, semanticColors } from "@/constants/theme";
import {
  ChevronLeft as ChevronLeftIcon,
  Menu as MenuIcon,
  X as XIcon,
  type LucideIcon,
} from "lucide-react-native";
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from "react-native";

type HeaderIconButtonProps = {
  accessibilityLabel: string;
  icon: LucideIcon;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

type SemanticHeaderButtonProps = {
  accessibilityLabel?: string;
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

export const HeaderBackButton = ({
  accessibilityLabel = "Go back",
  onPress,
  style,
}: SemanticHeaderButtonProps) => (
  <HeaderIconButton
    accessibilityLabel={accessibilityLabel}
    icon={ChevronLeftIcon}
    onPress={onPress}
    style={style}
  />
);

export const HeaderCloseButton = ({
  accessibilityLabel = "Close",
  onPress,
  style,
}: SemanticHeaderButtonProps) => (
  <HeaderIconButton
    accessibilityLabel={accessibilityLabel}
    icon={XIcon}
    onPress={onPress}
    style={style}
  />
);

export const HeaderMenuButton = ({
  accessibilityLabel = "Open menu",
  onPress,
  style,
}: SemanticHeaderButtonProps) => (
  <HeaderIconButton
    accessibilityLabel={accessibilityLabel}
    icon={MenuIcon}
    onPress={onPress}
    style={style}
  />
);

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
  },
});
