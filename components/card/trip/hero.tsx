import { ListUsersHorizontalIcons } from "@/components/list/users/horizontal-icons";
import { TitleRegular } from "@/components/title/regular";
import { UIInProgressBadge } from "@/components/ui/in-progress-badge";
import { UIProgressBar } from "@/components/ui/progress-bar";
import { colors, gaps, getCardBasicStyle, getColor } from "@/constants/theme";
import { getTripProgress } from "@/lib/helper/trip";
import { formatDate } from "@/lib/helper/utils";
import { type Trip } from "@/types/trip";

import { ChevronRight as ChevronRightIcon } from "lucide-react-native";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import {
  SharedTripIndicator,
  TRIP_SHARING_ACCESSIBILITY_LABELS,
  type TripSharing,
} from "./shared-trip-indicator";

type CardTripHeroProps = {
  trip: Trip;
  sharing: TripSharing;
  onPress: () => void;
};

export const CardTripHero = ({
  trip,
  sharing,
  onPress,
}: CardTripHeroProps) => {
  const progress = getTripProgress(trip.startDate, trip.endDate);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.82}
      accessibilityRole="button"
      accessibilityLabel={`Open ongoing trip ${trip.title}. ${TRIP_SHARING_ACCESSIBILITY_LABELS[sharing]}`}
    >
      <View style={styles.content}>
        <UIInProgressBadge containerStyle={styles.inProgress} />
        <TitleRegular size="md" weight="600" numberOfLines={2}>
          {trip.title}
        </TitleRegular>

        <TitleRegular
          size="xs"
          color={colors.textLightGrey}
        >{`${formatDate(trip.startDate)} - ${formatDate(
          trip.endDate,
        )}`}</TitleRegular>

        {progress ? (
          <View style={styles.progressContainer}>
            <UIProgressBar progress={progress.percentage} height={6} />
            <TitleRegular size="xs" color={colors.textLightGrey}>
              Day {progress.currentDay} of {progress.totalDays}
            </TitleRegular>
          </View>
        ) : null}
        {sharing !== "single-user" ? (
          <View style={styles.sharingMetadata}>
            <SharedTripIndicator sharing={sharing} />
          </View>
        ) : null}
        <ListUsersHorizontalIcons users={trip.companions} max={3} />
      </View>
      <View style={styles.trailingContainer}>
        <ChevronRightIcon size={24} color={getColor(colors.waffle)} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingRight: 4,
    flexDirection: "row",
    ...getCardBasicStyle("md"),
  },
  content: {
    flexDirection: "column",
    flex: 1,
    gap: gaps.xxs,
    paddingRight: 10,
  },
  inProgress: {
    alignSelf: "flex-start",
    marginBottom: gaps.xs,
  },
  sharingMetadata: {
    marginBottom: gaps.xxs,
  },
  progressContainer: {
    flexDirection: "column",
    gap: 4,
    marginBottom: gaps.xs,
  },
  trailingContainer: {
    alignSelf: "stretch",
    width: 28,
    alignItems: "center",
    justifyContent: "center",
  },
});
