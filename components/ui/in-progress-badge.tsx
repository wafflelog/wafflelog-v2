import { colors, getColor } from "@/constants/theme";
import { useEffect, useRef } from "react";
import { Animated, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { UIText } from "./text";

type UIInProgressBadgeProps = {
  text?: string;
  containerStyle?: StyleProp<ViewStyle>;
};

export function UIInProgressBadge({
  text = "In Progress",
  containerStyle,
}: UIInProgressBadgeProps) {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const flickerAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    );

    flickerAnimation.start();

    return () => {
      flickerAnimation.stop();
    };
  }, [opacity]);

  return (
    <View style={[styles.container, containerStyle]}>
      <Animated.View
        style={[
          styles.dot,
          {
            opacity,
          },
        ]}
      />
      <UIText style={styles.text} weight="600">
        {text}
      </UIText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: getColor(colors.waffle, 0.2),
    paddingHorizontal: 12,
    paddingVertical: 2,
    borderRadius: 32,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: getColor(colors.orange),
  },
  text: {
    color: getColor(colors.orange),
    fontSize: 12,
  },
});
