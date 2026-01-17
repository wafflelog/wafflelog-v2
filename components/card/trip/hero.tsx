import { ListUsersHorizontalIcons } from "@/components/list/users/horizontal-icons";
import { UIInProgressBadge } from "@/components/ui/in-progress-badge";
import { UIProgressBar } from "@/components/ui/progress-bar";
import { UIText } from "@/components/ui/text";
import { colors, getColor } from "@/constants/theme";
import { USERS } from "@/data";
import { formatDate } from "@/lib/utils";
import { type Trip } from "@/types";

import { useRouter } from "expo-router";
import {
  ChevronRight as ChevronRightIcon,
  MapPin as MapPinIcon,
} from "lucide-react-native";
import { StyleSheet, TouchableOpacity, View } from "react-native";

type CardTripHeroProps = {
  trip: Trip;
};

export const CardTripHero = ({ trip }: CardTripHeroProps) => {
  const router = useRouter();

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => router.push("/trip")}
    >
      <View style={styles.content}>
        <UIInProgressBadge containerStyle={styles.inProgress} />
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

        <View style={styles.progressContainer}>
          <UIProgressBar progress={50} height={6} />
          <UIText style={styles.progressText}>Day 3 of 7</UIText>
        </View>
        <ListUsersHorizontalIcons users={USERS} max={3} />
      </View>
      <View style={styles.chevronContainer}>
        <ChevronRightIcon size={36} color={getColor(colors.waffle)} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    paddingRight: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 2,
    borderColor: getColor(colors.waffle),
    flexDirection: "row",
  },
  content: {
    flexDirection: "column",
    flex: 1,
    gap: 10,
    paddingRight: 10,
  },
  inProgress: {
    alignSelf: "flex-start",
  },
  title: {
    fontSize: 20,
    color: getColor(colors.textDarkGrey),
  },
  date: {
    fontSize: 14,
    color: getColor(colors.textLightGrey),
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationText: {
    fontSize: 14,
    color: getColor(colors.textLightGrey),
  },
  progressContainer: {
    flexDirection: "column",
    gap: 4,
  },
  progressText: {
    fontSize: 14,
    color: getColor(colors.textLightGrey),
  },
  chevronContainer: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
});
