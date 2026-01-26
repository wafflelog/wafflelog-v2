import { ListUsersHorizontalIcons } from "@/components/list/users/horizontal-icons";
import { TitleRegular } from "@/components/title/regular";
import { colors, gaps, getCardBasicStyle, getColor } from "@/constants/theme";
import { formatDate } from "@/lib/utils";
import { type Trip } from "@/types/trip";

import {
  ChevronRight as ChevronRightIcon,
  MapPin as MapPinIcon,
} from "lucide-react-native";
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
      style={[styles.container, { borderLeftColor: getColor(colors[color]) }]}
      onPress={onPress}
    >
      <View style={styles.content}>
        <TitleRegular size="lg">{trip.title}</TitleRegular>

        <TitleRegular size="sm">{`${formatDate(trip.startDate)} - ${formatDate(
          trip.endDate
        )}`}</TitleRegular>

        <View style={styles.locationContainer}>
          <MapPinIcon size={16} color={getColor(colors.pineGreen)} />
          <TitleRegular size="sm">{trip.location}</TitleRegular>
        </View>
        <ListUsersHorizontalIcons users={trip.companions} max={3} />
      </View>
      <View style={styles.chevronContainer}>
        <ChevronRightIcon size={36} color={getColor(colors[color])} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    ...getCardBasicStyle("md"),
    flexDirection: "row",
    alignItems: "center",
    borderLeftWidth: 2,
  },
  content: {
    flexDirection: "column",
    flex: 1,
    gap: gaps.sm,
    paddingRight: 10,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  chevronContainer: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
});
