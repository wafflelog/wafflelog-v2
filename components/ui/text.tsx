import { type FontWeight, getFontFamily } from "@/lib/utils";
import { StyleProp, StyleSheet, Text, TextStyle } from "react-native";

type UITextProps = {
  children: React.ReactNode;
  weight?: FontWeight;
  style?: StyleProp<TextStyle>;
};

export function UIText({ children, weight = "400", style }: UITextProps) {
  const fontFamily = getFontFamily(weight);
  return <Text style={[styles.text, { fontFamily }, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  text: {},
});
