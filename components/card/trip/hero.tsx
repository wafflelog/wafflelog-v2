import { ListUsersHorizontalIcons } from "@/components/list/users/horizontal-icons";
import { TitleRegular } from "@/components/title/regular";
import { UIInProgressBadge } from "@/components/ui/in-progress-badge";
import { UIProgressBar } from "@/components/ui/progress-bar";
import { colors, gaps, getCardBasicStyle, getColor } from "@/constants/theme";
import { formatDate } from "@/lib/utils";
import { type Trip } from "@/types/trip";

import {
  ChevronRight as ChevronRightIcon,
  MapPin as MapPinIcon,
} from "lucide-react-native";
import { StyleSheet, TouchableOpacity, View } from "react-native";

type CardTripHeroProps = {
  trip: Trip;
  onPress: () => void;
};

export const CardTripHero = ({ trip, onPress }: CardTripHeroProps) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.content}>
        <UIInProgressBadge containerStyle={styles.inProgress} />
        <TitleRegular size="lg">{trip.title}</TitleRegular>

        <TitleRegular size="sm">{`${formatDate(trip.startDate)} - ${formatDate(
          trip.endDate
        )}`}</TitleRegular>

        <View style={styles.locationContainer}>
          <MapPinIcon size={16} color={getColor(colors.pineGreen)} />
          <TitleRegular size="sm">{trip.location}</TitleRegular>
        </View>

        <View style={styles.progressContainer}>
          <UIProgressBar progress={50} height={6} />
          <TitleRegular size="sm">Day 3 of 7</TitleRegular>
        </View>
        <ListUsersHorizontalIcons users={trip.companions} max={3} />
      </View>
      <View style={styles.chevronContainer}>
        <ChevronRightIcon size={36} color={getColor(colors.waffle)} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingRight: 4,
    borderWidth: 2,
    borderColor: getColor(colors.waffle),
    flexDirection: "row",
    ...getCardBasicStyle("lg"),
  },
  content: {
    flexDirection: "column",
    flex: 1,
    gap: gaps.sm,
    paddingRight: 10,
  },
  inProgress: {
    alignSelf: "flex-start",
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  progressContainer: {
    flexDirection: "column",
    gap: 4,
  },
  chevronContainer: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
});
