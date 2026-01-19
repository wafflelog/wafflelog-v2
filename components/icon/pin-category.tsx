import { colors, getColor } from "@/constants/theme";
import { type PinCategory } from "@/types/pin";

import {
  BedDouble,
  Landmark,
  Mountain,
  ShoppingBag,
  Utensils,
} from "lucide-react-native";
import { match } from "ts-pattern";

type IconPinCategoryProps = {
  category: PinCategory;
  size?: number;
};

export const IconPinCategory = ({
  category,
  size = 24,
}: IconPinCategoryProps) => {
  return match(category.name)
    .with("attraction", () => (
      <Landmark size={size} color={getColor(colors[category.color])} />
    ))
    .with("restaurant", () => (
      <Utensils size={size} color={getColor(colors[category.color])} />
    ))
    .with("hotel", () => (
      <BedDouble size={size} color={getColor(colors[category.color])} />
    ))
    .with("shopping", () => (
      <ShoppingBag size={size} color={getColor(colors[category.color])} />
    ))
    .with("nature", () => (
      <Mountain size={size} color={getColor(colors[category.color])} />
    ))
    .exhaustive();
};
