import { HeaderIconButton } from "@/components/header/icon-button";
import { UIText } from "@/components/ui/text";
import { semanticColors } from "@/constants/theme";
import { formatDateRange } from "@/lib/helper/utils";
import { type Trip } from "@/types/trip";
import {
  ChevronLeft as ChevronLeftIcon,
  Menu as MenuIcon,
} from "lucide-react-native";
import { StyleSheet, View } from "react-native";

type HeaderTripTitleProps = {
  sectionTitle?: string;
  trip?: Pick<Trip, "title" | "startDate" | "endDate"> | null;
};

type HeaderTripButtonProps = {
  onPress: () => void;
};

export const HeaderTripTitle = ({
  sectionTitle,
  trip,
}: HeaderTripTitleProps) => {
  const title = sectionTitle ?? trip?.title ?? "Trip";
  const subtitle = sectionTitle
    ? trip?.title
    : trip
      ? formatDateRange(trip.startDate, trip.endDate)
      : null;

  return (
    <View style={styles.nativeTitle}>
      <UIText style={styles.headerTitle} weight="700" numberOfLines={1}>
        {title}
      </UIText>
      {subtitle && (
        <UIText style={styles.headerSubtitle} numberOfLines={1}>
          {subtitle}
        </UIText>
      )}
    </View>
  );
};

export const HeaderTripBackButton = ({
  onPress,
}: HeaderTripButtonProps) => (
  <HeaderIconButton
    accessibilityLabel="Go back"
    icon={ChevronLeftIcon}
    onPress={onPress}
  />
);

export const HeaderTripMenuButton = ({ onPress }: HeaderTripButtonProps) => (
  <HeaderIconButton
    accessibilityLabel="Open trip menu"
    icon={MenuIcon}
    onPress={onPress}
  />
);

const styles = StyleSheet.create({
  nativeTitle: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: semanticColors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 13,
    color: semanticColors.textSecondary,
    marginTop: 2,
  },
});
