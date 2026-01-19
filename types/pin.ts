import { colors } from "@/constants/theme";

export type Pin = {
  id: string;
  name: string;
  category: PinCategory;
  address: string;
  time: string;
};

export type PinCategory = {
  id: string;
  name: "attraction" | "restaurant" | "hotel" | "shopping" | "nature";
  color: keyof typeof colors;
};
