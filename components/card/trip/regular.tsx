import { ListUsersHorizontalIcons } from "@/components/list/users/horizontal-icons";
import { TitleRegular } from "@/components/title/regular";
import { colors, gaps, getCardBasicStyle, getColor } from "@/constants/theme";
import { formatDate } from "@/lib/helper/utils";
import { type Trip } from "@/types/trip";

import { ChevronRight as ChevronRightIcon } from "lucide-react-native";
import { StyleSheet, TouchableOpacity, View } from "react-native";

type CardTripRegularProps = {
  trip: Trip;
  onPress: () => void;
  color?: keyof typeof colors;
};

export const CardTripRegular = ({
  trip,
  onPress,
  color = "waffle",
}: CardTripRegularProps) => {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.82}
      accessibilityRole="button"
      accessibilityLabel={`Open ${trip.title}`}
    >
      <View style={styles.content}>
        <TitleRegular size="md" weight="600" numberOfLines={2}>
          {trip.title}
        </TitleRegular>

        <TitleRegular
          size="xs"
          color={colors.textLightGrey}
        >{`${formatDate(trip.startDate)} - ${formatDate(
          trip.endDate,
        )}`}</TitleRegular>

        <ListUsersHorizontalIcons users={trip.companions} max={3} />
      </View>
      <View style={styles.chevronContainer}>
        <ChevronRightIcon size={24} color={getColor(colors[color])} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    ...getCardBasicStyle("sm"),
    flexDirection: "row",
    alignItems: "center",
    // borderWidth: 1,
  },
  content: {
    flexDirection: "column",
    flex: 1,
    gap: gaps.xxs,
    paddingRight: 10,
  },
  chevronContainer: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
});
