import { TitleRegular } from "@/components/title/regular";
import { borderRadiuses, colors, gaps, getColor } from "@/constants/theme";
import {
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from "react-native";

export type DrawerItem = {
  label: string;
  isActive?: boolean;
  onPress: () => void;
  icon?: (color: string) => React.ReactNode;
};

type DrawerItemRegularProps = {
  item: DrawerItem;
  style?: StyleProp<ViewStyle>;
};

const activeTextColor = colors.white;
const inactiveTextColor = colors.textLightGrey;
const activeBackgroundColor = colors.waffle;

export function DrawerItemRegular({ item, style }: DrawerItemRegularProps) {
  return (
    <TouchableOpacity
      onPress={item.onPress}
      style={[styles.container, style, item.isActive && styles.active]}
    >
      {item.icon &&
        item.icon(
          item.isActive
            ? getColor(activeTextColor)
            : getColor(inactiveTextColor),
        )}
      <TitleRegular
        size="sm"
        weight="500"
        color={item.isActive ? activeTextColor : inactiveTextColor}
      >
        {item.label}
      </TitleRegular>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadiuses.md,
    paddingVertical: gaps.xs,
    paddingHorizontal: gaps.md,
    flexDirection: "row",
    alignItems: "center",
    gap: gaps.sm,
  },
  active: {
    backgroundColor: getColor(activeBackgroundColor),
  },
});
