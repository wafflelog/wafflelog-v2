import { Platform, StyleProp, StyleSheet, Text, TextStyle } from "react-native";

type FontWeight = "400" | "500" | "600" | "700";

type UITextProps = {
  children: React.ReactNode;
  weight?: FontWeight;
  style?: StyleProp<TextStyle>;
};

const getFontFamily = (weight: FontWeight = "400") => {
  const fontMap = {
    "400": {
      android: "Montserrat_400Regular",
      ios: "Montserrat-Regular",
    },
    "500": {
      android: "Montserrat_500Medium",
      ios: "Montserrat-Medium",
    },
    "600": {
      android: "Montserrat_600SemiBold",
      ios: "Montserrat-SemiBold",
    },
    "700": {
      android: "Montserrat_700Bold",
      ios: "Montserrat-Bold",
    },
  };

  return Platform.select(fontMap[weight]);
};

export function UIText({ children, weight = "400", style }: UITextProps) {
  const fontFamily = getFontFamily(weight);
  return <Text style={[styles.text, { fontFamily }, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  text: {},
});
