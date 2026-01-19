import { colors } from "@/constants/theme";

export type ReferenceLink = {
  id: string;
  title: string;
  url: string;
  caption?: string;
};

export type Pin = {
  id: string;
  name: string;
  category: PinCategory;
  address: string;
  time: string;
  referenceLinks: ReferenceLink[];
};

export type PinCategory = {
  id: string;
  name: "attraction" | "restaurant" | "hotel" | "shopping" | "nature";
  color: keyof typeof colors;
};
