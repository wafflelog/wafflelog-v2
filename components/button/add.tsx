import { borderRadiuses, colors, gaps, getColor } from "@/constants/theme";
import { CirclePlus as CirclePlusIcon } from "lucide-react-native";
import {
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { TitleRegular } from "../title/regular";

type ButtonAddProps = {
  text: string;
  style?: StyleProp<ViewStyle>;
  onPress: () => void;
};

export function ButtonAdd({ text, onPress, style }: ButtonAddProps) {
  return (
    <TouchableOpacity style={[styles.container, style]} onPress={onPress}>
      <View style={styles.iconContainer}>
        <CirclePlusIcon size={24} color={getColor(colors.waffle)} />
      </View>
      <TitleRegular size="sm" weight="600">
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
    backgroundColor: "#fff",
    borderStyle: "dashed",
    borderWidth: 2,
    borderColor: getColor(colors.whiteGrey),
    borderRadius: borderRadiuses.sm,
    gap: gaps.sm,
    padding: gaps.sm,
    minWidth: 0,
  },
  iconContainer: {
    flexShrink: 0,
  },
  text: {
    fontSize: 14,
    fontWeight: "600",
    color: getColor(colors.textLightGrey),
    flexShrink: 1,
    minWidth: 0,
  },
});
