import { colors, gaps, getColor } from "@/constants/theme";
import { Trash2 as Trash2Icon } from "lucide-react-native";
import { StyleSheet, TouchableOpacity } from "react-native";

type ImageDeleteButtonProps = {
  onPress: () => void;
};

export function ImageDeleteButton({ onPress }: ImageDeleteButtonProps) {
  return (
    <TouchableOpacity
      style={styles.button}
      onPress={(event) => {
        event.stopPropagation();
        onPress();
      }}
      hitSlop={8}
    >
      <Trash2Icon size={16} color={getColor(colors.white)} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    position: "absolute",
    top: gaps.xs,
    right: gaps.xs,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: getColor(colors.black, 0.6),
    justifyContent: "center",
    alignItems: "center",
  },
});
