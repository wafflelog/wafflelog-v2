import { type Trip } from "@/types/trip";
import { match } from "ts-pattern";

import { colors } from "@/constants/theme";
import { router } from "expo-router";
import { CardTripHero } from "./hero";
import { CardTripRegular } from "./regular";
import { type TripSharing } from "./shared-trip-indicator";

type CardTripProps = {
  trip: Trip;
  variant: "hero" | "regular";
  sharing: TripSharing;
  color?: keyof typeof colors;
};

export const CardTrip = ({
  trip,
  variant,
  sharing,
  color = "waffle",
}: CardTripProps) => {
  const onPress = () => {
    router.push(`/trip/${trip.id}`);
  };

  return match(variant)
    .with("hero", () => (
      <CardTripHero
        trip={trip}
        sharing={sharing}
        onPress={onPress}
      />
    ))
    .with("regular", () => (
      <CardTripRegular
        trip={trip}
        sharing={sharing}
        onPress={onPress}
        color={color}
      />
    ))
    .exhaustive();
};
