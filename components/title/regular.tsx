import { UIText } from "@/components/ui/text";
import { colors, fontSizes, getColor } from "@/constants/theme";
import { StyleProp, StyleSheet, TextStyle } from "react-native";

type TitleRegularProps = {
  size?: "xxs" | "xs" | "sm" | "md" | "lg" | "xl" | "xxl";
  children: React.ReactNode;
  color?: [number, number, number];
  style?: StyleProp<TextStyle>;
  weight?: "400" | "500" | "600" | "700";
};

const fontWeights = {
  xxs: "400",
  xs: "400",
  sm: "400",
  md: "500",
  lg: "600",
  xl: "700",
  xxl: "700",
} as const satisfies Record<string, string>;

export function TitleRegular({
  size = "md",
  children,
  color = colors.textLightGrey,
  style,
  weight,
}: TitleRegularProps) {
  return (
    <UIText
      style={[
        styles.title,
        { fontSize: fontSizes[size], color: getColor(color) },
        style,
      ]}
      weight={weight || fontWeights[size]}
    >
      {children}
    </UIText>
  );
}

const styles = StyleSheet.create({
  title: {},
});
