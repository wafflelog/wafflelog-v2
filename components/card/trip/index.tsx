import { Trip } from "@/types";
import { Text, View } from "react-native";
import { CardTripHero } from "./hero";

type CardTripProps = {
  trip: Trip;
  variant: "hero" | "default";
};

export default function CardTrip({ trip, variant }: CardTripProps) {
  if (variant === "hero") {
    return <CardTripHero trip={trip} />;
  }

  return (
    <View>
      <Text>Trip Card</Text>
    </View>
  );
}
