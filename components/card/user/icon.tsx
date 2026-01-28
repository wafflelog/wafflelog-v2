import { TitleRegular } from "@/components/title/regular";
import { borderRadiuses, colors, getColor } from "@/constants/theme";
import { User } from "@/types/user";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

type CardUserIconProps = {
  user: User;
  size?: "sm" | "md" | "lg";
  radius?: "xs" | "sm" | "md" | "lg" | "full";
  containerStyle?: StyleProp<ViewStyle>;
};

const sizes = {
  sm: 30,
  md: 40,
  lg: 60,
} as const satisfies Record<"sm" | "md" | "lg", number>;

export const CardUserIcon = ({
  user,
  size = "md",
  radius = "md",
  containerStyle,
}: CardUserIconProps) => {
  return (
    <View
      style={[
        styles.container,
        {
          width: sizes[size],
          height: sizes[size],
          borderRadius: borderRadiuses[radius] / 2,
        },
        containerStyle,
      ]}
    >
      <TitleRegular size={size} weight="600" color={colors.white}>
        {user.fullname.charAt(0)}
      </TitleRegular>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: getColor(colors.waffle),
    alignItems: "center",
    justifyContent: "center",
  },
});
