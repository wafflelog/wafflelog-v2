import { TitleRegular } from "@/components/title/regular";
import {
  borderRadiuses,
  colors,
  gaps,
  getCardBasicStyle,
  semanticColors,
} from "@/constants/theme";
import {
  type StyleProp,
  StyleSheet,
  TouchableOpacity,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ButtonFabProps = {
  onPress: () => void;
  text: string;
  icon: (color: string) => React.ReactNode;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

export function ButtonFab({
  onPress,
  text,
  icon,
  style,
  accessibilityLabel = text,
}: ButtonFabProps) {
  const insets = useSafeAreaInsets();

  return (
    <TouchableOpacity
      style={[styles.fab, style, { bottom: insets.bottom + gaps.md }]}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      {icon(semanticColors.primaryActionContent)}
      <TitleRegular size="sm" weight="600" color={colors.textDarkGrey}>
        {text}
      </TitleRegular>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: gaps.md,
    flexDirection: "row",
    alignItems: "center",
    ...getCardBasicStyle("sm"),
    backgroundColor: semanticColors.primaryAction,
    borderColor: semanticColors.primaryAction,
    borderRadius: borderRadiuses.full,
    gap: gaps.xs,
    minHeight: 52,
    paddingHorizontal: gaps.md,
  },
});
