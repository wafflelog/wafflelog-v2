import { colors, getColor, semanticColors } from "@/constants/theme";
import {
  ChevronLeft as ChevronLeftIcon,
  Menu as MenuIcon,
  Settings as SettingsIcon,
  X as XIcon,
  type LucideIcon,
} from "lucide-react-native";
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { KeyboardController } from "react-native-keyboard-controller";

type HeaderIconButtonProps = {
  accessibilityLabel: string;
  dismissKeyboardOnPress?: boolean;
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
  dismissKeyboardOnPress = false,
  icon: Icon,
  onPress,
  style,
}: HeaderIconButtonProps) => {
  const handlePress = () => {
    if (dismissKeyboardOnPress) {
      void KeyboardController.dismiss();
    }

    onPress();
  };

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      hitSlop={4}
      onPress={handlePress}
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
    dismissKeyboardOnPress
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
    dismissKeyboardOnPress
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

export const HeaderSettingsButton = ({
  accessibilityLabel = "Open settings",
  onPress,
  style,
}: SemanticHeaderButtonProps) => (
  <HeaderIconButton
    accessibilityLabel={accessibilityLabel}
    icon={SettingsIcon}
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
