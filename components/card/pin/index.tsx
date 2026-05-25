import { type Pin } from "@/types/pin";
import { match } from "ts-pattern";

import { useRouter } from "expo-router";
import { CardPinRegular } from "./regular";

type CardPinProps = {
  pin: Pin;
  variant: "regular";
  selectedDate: string;
};

export const CardPin = ({ pin, variant, selectedDate }: CardPinProps) => {
  const router = useRouter();
  const onPress = () => {
    router.push(`/pin/${pin.id}`);
  };

  return match(variant)
    .with("regular", () => (
      <CardPinRegular
        pin={pin}
        selectedDate={selectedDate}
        onPress={onPress}
      />
    ))
    .exhaustive();
};
