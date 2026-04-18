import { supabase } from "./client";
import { type Tables, type TablesInsert } from "./types";

export type CreateTripInput = {
  title: string;
  startDate: string;
  endDate: string;
};

export type TripRow = Tables<"trip">;

const mapTripRow = (trip: TripRow) => ({
  id: trip.id,
  title: trip.title,
  startDate: trip.start_date,
  endDate: trip.end_date,
  createdAt: trip.created_at,
  updatedAt: trip.updated_at,
});

export async function createTrip(input: CreateTripInput) {
  const payload: TablesInsert<"trip"> = {
    title: input.title.trim(),
    start_date: input.startDate,
    end_date: input.endDate,
  };

  const { data, error } = await supabase
    .from("trip")
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return mapTripRow(data);
}
