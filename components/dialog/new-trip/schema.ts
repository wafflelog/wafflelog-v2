import {
  getTripDurationDays,
  MAX_TRIP_DURATION_DAYS,
  TRIP_DURATION_LIMIT_MESSAGE,
} from "@/lib/helper/trip";
import { iso, z } from "zod";

export const newTripFormSchema = z
  .object({
    tripName: z
      .string()
      .trim()
      .min(1, "Enter a trip name")
      .max(200, "Trip name is too long"),
    tripStartDate: z
      .string()
      .min(1, "Select a trip start date")
      .pipe(iso.date()),
    tripEndDate: z
      .string()
      .min(1, "Select a trip end date")
      .pipe(iso.date()),
  })
  .superRefine((data, context) => {
    const durationDays = getTripDurationDays(
      data.tripStartDate,
      data.tripEndDate,
    );

    if (durationDays === null) {
      context.addIssue({
        code: "custom",
        message: "End date must be on or after the start date",
        path: ["tripEndDate"],
      });
      return;
    }

    if (durationDays > MAX_TRIP_DURATION_DAYS) {
      context.addIssue({
        code: "custom",
        message: TRIP_DURATION_LIMIT_MESSAGE,
        path: ["tripEndDate"],
      });
    }
  });

export type NewTripFormValues = z.infer<typeof newTripFormSchema>;
