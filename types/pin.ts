import { colors } from "@/constants/theme";
import { type User } from "./user";

export type Creator = {
  userId: string;
  username: string | null;
  isCurrentUser: boolean;
};

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
  creator?: Creator;
};

export type ReferenceLink = {
  id: string;
  title: string;
  url: string;
  caption?: string;
  creator?: Creator;
};

export type Document = {
  id: string;
  fileName: string;
  mimeType: string;
  url: string;
  caption?: string;
  creator?: Creator;
};

export type Expense = {
  id: string;
  description: string;
  context?: string;
  amount: number;
  currency: Currency;
  paidBy: User;
  creator?: Creator;
};

export type Note = {
  id: string;
  text: string;
  createdAt: string;
  createdBy: User;
};

export type Pin = {
  id: string;
  name: string | null;
  category: PinCategory;
  startDate: string;
  endDate: string | null;
  time: string | null;
  endTime: string | null;
  metadata: PinMetadata;
  location: Location;
  referenceLinks: ReferenceLink[];
  documents: Document[];
  expenses: Expense[];
  images: Image[];
  notes: Note[];
  creator?: Creator;
};

export type PinCategory = {
  id:
    | "attraction"
    | "food"
    | "stay"
    | "shopping"
    | "nature"
    | "transport"
    | "event"
    | "other";
  name: PinCategory["id"];
  color: keyof typeof colors;
};

export type PinMetadata = {
  version: 1;
  departure?: string;
  destination?: string;
};
