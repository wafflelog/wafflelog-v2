import { borderRadiuses, colors, gaps, getColor } from "@/constants/theme";
import {
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { TitleRegular } from "../title/regular";

type UITabProps = {
  text: string;
  style?: StyleProp<ViewStyle>;
  onPress: () => void;
  variant?: "long" | "short";
  isActive?: boolean;
  icon?: (color: string) => React.ReactNode;
};

export function UITab({
  text,
  onPress,
  style,
  icon,
  isActive = false,
  variant = "long",
}: UITabProps) {
  return (
    <TouchableOpacity
      style={[
        styles.container,
        style,
        isActive && styles.active,
        variant === "long" && styles.longContainer,
        variant === "short" && styles.shortContainer,
      ]}
      onPress={onPress}
    >
      {icon && (
        <View style={styles.icon}>
          {icon(
            isActive ? getColor(colors.orange) : getColor(colors.textLightGrey)
          )}
        </View>
      )}
      <TitleRegular
        size="sm"
        weight="600"
        color={isActive ? colors.orange : colors.textLightGrey}
      >
        {text}
      </TitleRegular>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 0,
  },
  longContainer: {
    borderRadius: borderRadiuses.sm,
    gap: gaps.sm,
    padding: gaps.sm,
  },
  shortContainer: {
    borderRadius: borderRadiuses.full,
    gap: gaps.xs,
    paddingVertical: gaps.sm,
    paddingHorizontal: gaps.md,
  },
  active: {
    backgroundColor: getColor(colors.waffle, 0.2),
  },
  icon: {
    flexShrink: 0,
  },
});
