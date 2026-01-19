import { type Trip } from "@/types/trip";
import { match } from "ts-pattern";

import { colors } from "@/constants/theme";
import { router } from "expo-router";
import { CardTripHero } from "./hero";
import { CardTripRegular } from "./regular";

type CardTripProps = {
  trip: Trip;
  variant: "hero" | "regular";
  color?: keyof typeof colors;
};

export const CardTrip = ({
  trip,
  variant,
  color = "waffle",
}: CardTripProps) => {
  const onPress = () => {
    router.push(`/trip/${trip.id}`);
  };

  return match(variant)
    .with("hero", () => <CardTripHero trip={trip} onPress={onPress} />)
    .with("regular", () => (
      <CardTripRegular trip={trip} onPress={onPress} color={color} />
    ))
    .exhaustive();
};
