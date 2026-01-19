import { type Trip } from "@/types/trip";
import { PINS } from "./pins";
import { USERS } from "./users";

export const TRIPS = [
  {
    id: "trip-1",
    title: "Barcelona Getaway",
    startDate: new Date("2024-03-11").toISOString(),
    endDate: new Date("2024-03-17").toISOString(),
    location: "Barcelona, Spain",
    companions: [USERS[0], USERS[1], USERS[2], USERS[3], USERS[4]],
    pins: PINS,
  },
  {
    id: "trip-2",
    title: "London Adventure",
    startDate: new Date("2024-03-11").toISOString(),
    endDate: new Date("2024-03-18").toISOString(),
    location: "London, UK",
    companions: [USERS[2], USERS[3], USERS[4]],
    pins: PINS,
  },
  {
    id: "trip-3",
    title: "東京之旅",
    startDate: new Date("2024-03-11").toISOString(),
    endDate: new Date("2024-03-17").toISOString(),
    location: "Tokyo, Japan",
    companions: [USERS[0], USERS[1]],
    pins: PINS,
  },
] as const satisfies Trip[];
