import { TitleRegular } from "@/components/title/regular";
import {
  borderRadiuses,
  colors,
  gaps,
  getCardBasicStyle,
  getColor,
} from "@/constants/theme";
import { StyleSheet, TouchableOpacity } from "react-native";

type ButtonFabProps = {
  onPress: () => void;
  text: string;
  icon: (color: string) => React.ReactNode;
};

export function ButtonFab({ onPress, text, icon }: ButtonFabProps) {
  return (
    <TouchableOpacity style={styles.fab} onPress={onPress} activeOpacity={0.8}>
      {icon(getColor(colors.white))}
      <TitleRegular size="sm" weight="600" color={colors.white}>
        {text}
      </TitleRegular>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: gaps.xl,
    right: gaps.xl,
    flexDirection: "row",
    alignItems: "center",
    ...getCardBasicStyle("sm"),
    backgroundColor: getColor(colors.purple),
    borderRadius: borderRadiuses.full,
    gap: gaps.xs,
  },
});
