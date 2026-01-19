import { ListUsersHorizontalIcons } from "@/components/list/users/horizontal-icons";
import { UIText } from "@/components/ui/text";
import { colors, getColor } from "@/constants/theme";
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
        <UIText style={styles.title} weight="700">
          {trip.title}
        </UIText>

        <UIText style={styles.date}>
          {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
        </UIText>

        <View style={styles.locationContainer}>
          <MapPinIcon size={16} color={getColor(colors.pineGreen)} />
          <UIText style={styles.locationText}>{trip.location}</UIText>
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
    backgroundColor: "#fff",
    borderLeftWidth: 2,
    borderRadius: 8,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  content: {
    flexDirection: "column",
    flex: 1,
    gap: 10,
    paddingRight: 10,
  },
  title: {
    fontSize: 16,
    color: getColor(colors.textDarkGrey),
  },
  date: {
    fontSize: 12,
    color: getColor(colors.textLightGrey),
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    color: getColor(colors.textLightGrey),
  },
  chevronContainer: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
});
