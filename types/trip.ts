import {
  type Document,
  type Expense,
  type Image,
  type Pin,
  type ReferenceLink,
} from "./pin";
import { type User } from "./user";

export type ChecklistItem = {
  id: string;
  title: string;
  completed: boolean;
  createdBy: User;
};

export type TripDay = {
  date: string;
  isActive: boolean;
  onPress: () => void;
  pins: Pin[];
};

export type Trip = {
  id: string;
  title: string;
  /**
   * ISO 8601 date string (e.g., "2024-03-10T00:00:00.000Z")
   * Supabase timestamp/timestamptz columns return dates as ISO strings
   */
  startDate: string;
  /**
   * ISO 8601 date string (e.g., "2024-03-17T00:00:00.000Z")
   * Supabase timestamp/timestamptz columns return dates as strings
   */
  endDate: string;
  location: string;
  companions: User[];
  pins: Pin[];
  checklistItems: ChecklistItem[];
  referenceLinks: ReferenceLink[];
  documents: Document[];
  images: Image[];
  expenses: Expense[];
};
