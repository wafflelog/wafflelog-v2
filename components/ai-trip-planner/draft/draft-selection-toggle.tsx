import { TitleRegular } from "@/components/title/regular";
import {
  borderRadiuses,
  colors,
  gaps,
  getColor,
} from "@/constants/theme";
import { StyleSheet, TouchableOpacity } from "react-native";

type DraftSelectionToggleProps = {
  isAllSelected: boolean;
  color: "pineGreen" | "turquoise";
  onPress: () => void;
};

export function DraftSelectionToggle({
  isAllSelected,
  color,
  onPress,
}: DraftSelectionToggleProps) {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          borderColor: getColor(colors[color], 0.28),
          backgroundColor: getColor(colors[color], 0.08),
        },
      ]}
      onPress={onPress}
      activeOpacity={0.72}
      accessibilityRole="button"
      accessibilityLabel={isAllSelected ? "Deselect all" : "Select all"}
    >
      <TitleRegular size="xxs" weight="600" color={colors[color]}>
        {isAllSelected ? "Deselect all" : "Select all"}
      </TitleRegular>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 30,
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: borderRadiuses.full,
    paddingHorizontal: gaps.sm,
    paddingVertical: gaps.xxs,
  },
});
