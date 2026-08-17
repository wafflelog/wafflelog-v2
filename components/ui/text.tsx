import { type FontWeight, getFontFamily } from "@/lib/helper/utils";
import {
  StyleProp,
  StyleSheet,
  Text,
  TextProps,
  TextStyle,
} from "react-native";

type UITextProps = Omit<TextProps, "style"> & {
  children: React.ReactNode;
  weight?: FontWeight;
  style?: StyleProp<TextStyle>;
};

export function UIText({
  children,
  weight = "400",
  style,
  ...textProps
}: UITextProps) {
  const fontFamily = getFontFamily(weight);
  return (
    <Text {...textProps} style={[styles.text, { fontFamily }, style]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {},
});
