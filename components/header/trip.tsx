import { AppHeader } from "@/components/header/app-header";
import {
  HeaderBackButton,
  HeaderMenuButton,
} from "@/components/header/icon-button";
import { formatDateRange } from "@/lib/helper/utils";
import { type Trip } from "@/types/trip";

type HeaderTripProps = {
  onBackPress: () => void;
  onMenuPress: () => void;
  sectionTitle?: string;
  trip?: Pick<Trip, "title" | "startDate" | "endDate"> | null;
};

export const HeaderTrip = ({
  onBackPress,
  onMenuPress,
  sectionTitle,
  trip,
}: HeaderTripProps) => {
  const title = sectionTitle ?? trip?.title ?? "Trip";
  const subtitle = sectionTitle
    ? trip?.title
    : trip
      ? formatDateRange(trip.startDate, trip.endDate)
      : null;

  return (
    <AppHeader
      title={title}
      subtitle={subtitle}
      leading={
        <HeaderBackButton onPress={onBackPress} />
      }
      trailing={
        <HeaderMenuButton
          accessibilityLabel="Open trip menu"
          onPress={onMenuPress}
        />
      }
    />
  );
};
