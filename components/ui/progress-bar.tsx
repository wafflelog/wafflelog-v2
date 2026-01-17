import { colors, getColor } from "@/constants/theme";
import { StyleSheet, View } from "react-native";

type UIProgressBarProps = {
  progress: number;
  height?: number;
};

export function UIProgressBar({ progress, height = 10 }: UIProgressBarProps) {
  return (
    <View style={[styles.container, { height }]}>
      <View style={[styles.progress, { width: `${progress}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 10,
    backgroundColor: getColor(colors.waffle, 0.3),
    borderRadius: 10,
    overflow: "hidden",
  },
  progress: {
    height: "100%",
    backgroundColor: getColor(colors.waffle),
    borderRadius: 10,
  },
});
