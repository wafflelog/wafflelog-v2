import { colors } from "@/constants/theme";
import { type User } from "./user";

export const CURRENCIES = [
  "EUR",
  "USD",
  "GBP",
  "JPY",
  "CAD",
  "AUD",
  "CHF",
  "CNY",
  "HKD",
  "INR",
  "MXN",
  "NZD",
  "RUB",
  "SAR",
  "SGD",
  "ZAR",
] as const;

export type Currency = (typeof CURRENCIES)[number];

type Location = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
};

export type Image = {
  id: string;
  url: string;
  caption?: string;
  width: number;
  height: number;
};

export type ReferenceLink = {
  id: string;
  title: string;
  url: string;
  caption?: string;
};

export type Document = {
  id: string;
  fileName: string;
  mimeType: string;
  url: string;
  caption?: string;
};

export type Expense = {
  id: string;
  description: string;
  amount: number;
  currency: Currency;
  paidBy: User;
};

export type Note = {
  id: string;
  text: string;
  createdAt: string;
  createdBy: User;
};

export type Pin = {
  id: string;
  name: string;
  category: PinCategory;
  location: Location;
  time: string;
  referenceLinks: ReferenceLink[];
  documents: Document[];
  expenses: Expense[];
  images: Image[];
};

export type PinCategory = {
  id: string;
  name: "attraction" | "restaurant" | "hotel" | "shopping" | "nature";
  color: keyof typeof colors;
};
