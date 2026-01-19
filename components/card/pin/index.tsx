import { type Pin } from "@/types/pin";
import { match } from "ts-pattern";

import { CardPinRegular } from "./regular";

type CardPinProps = {
  pin: Pin;
  variant: "regular";
};

export const CardPin = ({ pin, variant }: CardPinProps) => {
  return match(variant)
    .with("regular", () => <CardPinRegular pin={pin} />)
    .exhaustive();
};
