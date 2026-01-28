import { CardUserIcon } from "@/components/card/user/icon";
import { UIText } from "@/components/ui/text";
import { colors, getColor } from "@/constants/theme";
import { User } from "@/types/user";
import { StyleSheet, View } from "react-native";

type ListUsersHorizontalIconsProps = {
  users: User[];
  max?: number;
};

const availableColors = [
  colors.waffle,
  colors.turquoise,
  colors.purple,
  colors.red,
  colors.pineGreen,
];

export const ListUsersHorizontalIcons = ({
  users,
  max = 5,
}: ListUsersHorizontalIconsProps) => {
  return (
    <View style={styles.container}>
      {users.slice(0, max).map((user, index) => (
        <CardUserIcon
          key={user.id}
          user={user}
          size="sm"
          radius="full"
          containerStyle={[
            styles.icon,
            {
              marginLeft: index !== 0 ? -8 : 0,
              backgroundColor: getColor(
                availableColors[index % availableColors.length],
              ),
            },
          ]}
        />
      ))}
      {users.length > max && (
        <View style={styles.moreContainer}>
          <UIText style={styles.moreText}>+{users.length - max} others</UIText>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
  },
  icon: {
    borderColor: "#fff",
    borderWidth: 2,
  },
  moreContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 6,
  },
  moreText: {
    fontSize: 14,
    color: getColor(colors.textLightGrey),
  },
});
