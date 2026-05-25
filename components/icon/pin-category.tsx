import { colors, getColor } from "@/constants/theme";
import { type PinCategory } from "@/types/pin";

import {
  BedDouble,
  Bus,
  CalendarDays,
  CircleHelp,
  Landmark,
  Mountain,
  ShoppingBag,
  Utensils,
} from "lucide-react-native";
import { match } from "ts-pattern";

type IconPinCategoryProps = {
  category: PinCategory;
  size?: number;
  color?: string;
};

export const IconPinCategory = ({
  category,
  size = 24,
  color,
}: IconPinCategoryProps) => {
  const iconColor = color ?? getColor(colors[category.color]);

  return match(category.name)
    .with("attraction", () => (
      <Landmark size={size} color={iconColor} />
    ))
    .with("food", () => (
      <Utensils size={size} color={iconColor} />
    ))
    .with("stay", () => (
      <BedDouble size={size} color={iconColor} />
    ))
    .with("shopping", () => (
      <ShoppingBag size={size} color={iconColor} />
    ))
    .with("nature", () => (
      <Mountain size={size} color={iconColor} />
    ))
    .with("transport", () => (
      <Bus size={size} color={iconColor} />
    ))
    .with("event", () => (
      <CalendarDays size={size} color={iconColor} />
    ))
    .with("other", () => (
      <CircleHelp size={size} color={iconColor} />
    ))
    .exhaustive();
};
