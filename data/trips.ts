import { Trip } from "@/types";

export const TRIPS = [
  {
    id: "trip-1",
    title: "Barcelona Getaway",
    startDate: new Date("2024-03-10").toISOString(),
    endDate: new Date("2024-03-17").toISOString(),
    location: "Barcelona, Spain",
  },
] as const satisfies Trip[];
