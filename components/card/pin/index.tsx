import { type Pin } from "@/types/pin";
import { match } from "ts-pattern";

import { useRouter } from "expo-router";
import { CardPinRegular } from "./regular";

type CardPinProps = {
  pin: Pin;
  variant: "regular";
};

export const CardPin = ({ pin, variant }: CardPinProps) => {
  const router = useRouter();
  const onPress = () => {
    router.push(`/pin/${pin.id}`);
  };

  return match(variant)
    .with("regular", () => <CardPinRegular pin={pin} onPress={onPress} />)
    .exhaustive();
};
