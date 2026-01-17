import { UIText } from "@/components/ui/text";
import { colors, getColor } from "@/constants/theme";
import { User } from "@/types/user";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

type CardUserIconProps = {
  user: User;
  size?: number;
  containerStyle?: StyleProp<ViewStyle>;
};

export const CardUserIcon = ({
  user,
  size = 40,
  containerStyle,
}: CardUserIconProps) => {
  return (
    <View
      style={[
        styles.container,
        { width: size, height: size, borderRadius: size / 2 },
        containerStyle,
      ]}
    >
      <UIText style={styles.text}>{user.fullname.charAt(0)}</UIText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: getColor(colors.waffle),
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 14,
    color: "#fff",
  },
});
